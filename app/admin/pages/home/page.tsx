"use client";

import { useState, useEffect } from "react";
import {
  Save,
  X,
  ArrowLeft,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { HeroContent, HomePageCardContent } from "@/lib/types/home";
import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";
import { HomePage } from "@/app/home/HomePageContent";

interface HomePageData {
  hero: HeroContent;
  homepageCards: HomePageCardContent[];
}

export default function EditHomePage() {
  const [data, setData] = useState<HomePageData | null>(null);
  const [originalData, setOriginalData] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<{
    [key: number]: boolean;
  }>({});
  const [localImages, setLocalImages] = useState<{
    [key: number]: { file: File; localUrl: string };
  }>({});
  const [imageUrls, setImageUrls] = useState<{
    [cardId: string]: string;
  }>({});

  useEffect(() => {
    loadHomePageData();
  }, []);

  useEffect(() => {
    if (data) {
      loadImageUrls();
    }
  }, [data]);

  useEffect(() => {
    if (data && originalData) {
      const dataChanged = JSON.stringify(data) !== JSON.stringify(originalData);
      const imagesChanged = Object.keys(localImages).length > 0;
      const changed = dataChanged || imagesChanged;
      setHasChanges(changed);
    }
  }, [data, originalData, localImages]);

  const loadHomePageData = async () => {
    try {
      setLoading(true);
      // Fetch data from the new path
      const response = await fetch("/api/firestore/document?path=pages/home");

      if (!response.ok) {
        throw new Error("Failed to fetch home page data");
      }

      const homePageData = await response.json();

      // Process the data to match our expected format
      const hero = homePageData?.hero || null;
      const homepageCards = homePageData?.homepageCards || [];

      const pageData = { hero, homepageCards };
      setData(pageData);
      setOriginalData(JSON.parse(JSON.stringify(pageData)));
    } catch (err) {
      setError("Failed to load home page data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadImageUrls = async () => {
    if (!data) return;

    try {
      const auth = getAuth(getFirebaseApp());
      const user = auth.currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();
      const newImageUrls: { [cardId: string]: string } = {};

      // Fetch URLs for all cards that have image paths
      for (const card of data.homepageCards) {
        console.log("card.image", card);
        if (
          card.image &&
          !card.image.startsWith("blob:") &&
          !card.image.startsWith("http")
        ) {
          try {
            console.log(
              "fetching image url for",
              card.image,
              encodeURIComponent(card.image)
            );

            const response = await fetch(
              `/api/storage/url?path=${encodeURIComponent(card.image)}`,
              {
                headers: { Authorization: `Bearer ${idToken}` },
              }
            );

            if (response.ok) {
              const result = await response.json();
              console.log("result", result);
              newImageUrls[card.id] = result.url;
            }
          } catch (err) {
            console.error(`Failed to get URL for ${card.image}:`, err);
          }
        }
      }

      setImageUrls(newImageUrls);
    } catch (err) {
      console.error("Failed to load image URLs:", err);
    }
  };

  const handleSave = async () => {
    if (!data) return;

    try {
      setSaving(true);
      setError(null);

      // Get user token for authentication
      const auth = getAuth(getFirebaseApp());
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
      const idToken = await user.getIdToken();

      // Upload local images to Google Cloud first
      const updatedCards = [...data.homepageCards];
      for (const [index, localImage] of Object.entries(localImages)) {
        const cardIndex = parseInt(index);
        const card = updatedCards[cardIndex];
        const cardId = card.id || `card-${cardIndex}`;

        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", localImage.file);
        formData.append("path", `home/cards/${cardId}`);

        const uploadResponse = await fetch("/api/storage/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload image");

        const uploadResult = await uploadResponse.json();
        const cloudImagePath = uploadResult.path; // Use the path, not downloadURL

        // Update the card with the cloud path
        updatedCards[cardIndex] = { ...card, image: cloudImagePath };
      }

      // Update data with cloud paths
      const dataWithCloudImages = { ...data, homepageCards: updatedCards };

      // Save to new path structure
      await fetch("/api/firestore/document?path=pages/home", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...dataWithCloudImages,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: user.uid,
          updatedBy: user.uid,
        }),
      });

      // Clean up local images and URLs
      Object.values(localImages).forEach((localImage) => {
        URL.revokeObjectURL(localImage.localUrl);
      });
      setLocalImages({});

      setOriginalData(JSON.parse(JSON.stringify(dataWithCloudImages)));
      setData(dataWithCloudImages);
      setHasChanges(false);
    } catch (err) {
      setError("Failed to save changes");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    // Clean up local image URLs and files
    Object.values(localImages).forEach((localImage) => {
      URL.revokeObjectURL(localImage.localUrl);
    });
    setLocalImages({});

    // Reset data to original state
    setData(JSON.parse(JSON.stringify(originalData)));
    setHasChanges(false);
  };

  const updateHero = (field: keyof HeroContent, value: string) => {
    if (!data) return;
    setData({
      ...data,
      hero: { ...data?.hero, [field]: value },
    });
  };

  const updateCard = (
    index: number,
    field: keyof HomePageCardContent,
    value: string
  ) => {
    if (!data) return;
    const updatedCards = [...data.homepageCards];
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    setData({ ...data, homepageCards: updatedCards });
  };

  const addCard = () => {
    if (!data) return;
    const newCard: HomePageCardContent = {
      id: `card-${Date.now()}`,
      title: "New Card",
      description: "Card description",
      link: "/",
      icon: "FileText",
      image: "/j9.png", // Default image
      verticalPosition: "center",
    };
    setData({
      ...data,
      homepageCards: [...data.homepageCards, newCard],
    });
  };

  const removeCard = (index: number) => {
    if (!data) return;
    const updatedCards = data.homepageCards.filter((_, i) => i !== index);
    setData({ ...data, homepageCards: updatedCards });
  };

  const uploadCardImage = async (index: number, file: File) => {
    if (!data || !file) return;

    try {
      setUploadingImages((prev) => ({ ...prev, [index]: true }));

      // Create local URL for immediate preview
      const localUrl = URL.createObjectURL(file);

      // Store the file and local URL locally
      setLocalImages((prev) => ({
        ...prev,
        [index]: { file, localUrl },
      }));

      // Don't update card.image - keep the original path
      // The local preview will use the localImages state
    } catch (err) {
      console.error("Failed to process image:", err);
      setError("Failed to process image");
    } finally {
      setUploadingImages((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleImageChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadCardImage(index, file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading home page data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-darker transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link
                  href="/admin"
                  className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-lg font-medium text-gray-900">
                  Edit Home Page
                </h1>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {hasChanges && (
                  <>
                    <button
                      onClick={handleDiscard}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Discard Changes
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-darker transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowPreview(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Hero Section
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={data.hero.title}
                    onChange={(e) => updateHero("title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={data.hero.description}
                    onChange={(e) => updateHero("description", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Homepage Cards */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Homepage Cards
                </h2>
                <button
                  onClick={addCard}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Card
                </button>
              </div>

              <div className="space-y-4">
                {data.homepageCards.map((card, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">
                        Card {index + 1}
                      </h3>
                      <button
                        onClick={() => removeCard(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) =>
                            updateCard(index, "title", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={card.description}
                          onChange={(e) =>
                            updateCard(index, "description", e.target.value)
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Link
                        </label>
                        <input
                          type="text"
                          value={card.link}
                          onChange={(e) =>
                            updateCard(index, "link", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Icon
                        </label>
                        <input
                          type="text"
                          value={card.icon}
                          onChange={(e) =>
                            updateCard(index, "icon", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const fileInput = document.getElementById(
                                `image-input-${index}`
                              ) as HTMLInputElement;
                              fileInput?.click();
                            }}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {localImages[index]
                              ? "Change Image"
                              : "Upload Image"}
                          </button>
                          <input
                            id={`image-input-${index}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(index, e)}
                            className="hidden"
                          />
                        </div>
                        {uploadingImages[index] && (
                          <p className="mt-2 text-sm text-gray-500">
                            Uploading...
                          </p>
                        )}
                        {/* Show existing cloud image if no local image is being uploaded */}
                        {!localImages[index] &&
                          card.image &&
                          imageUrls[card.id] && (
                            <div className="mt-2">
                              <div className="mb-2">
                                <img
                                  src={imageUrls[card.id]}
                                  alt={card.title}
                                  className="w-20 h-20 object-cover rounded border border-gray-300"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <ImageIcon className="h-4 w-4 mr-1" />
                                <span>Cloud: {card.image}</span>
                              </div>
                            </div>
                          )}
                        {/* Show local image preview when uploading */}
                        {localImages[index] && (
                          <div className="mt-2">
                            <div className="mb-2">
                              <img
                                src={localImages[index].localUrl}
                                alt={card.title}
                                className="w-20 h-20 object-cover rounded border border-gray-300"
                              />
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <ImageIcon className="h-4 w-4 mr-1" />
                              <span>Local: {localImages[index].file.name}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Page Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white w-full h-full max-w-6xl max-h-[90vh] rounded-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Preview Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Page Preview
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto">
              <HomePage
                hero={data.hero}
                homepageCards={data.homepageCards.map((card, index) => ({
                  ...card,
                  // Use local image URL if available, otherwise use cloud URL
                  image:
                    localImages[index]?.localUrl ||
                    imageUrls[card.id] ||
                    card.image,
                }))}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
