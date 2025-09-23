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
  ChevronDown,
  Tent,
  Users,
  Volleyball,
  Rainbow,
  Heart,
  Star,
  Lightbulb,
  BookOpen,
  GraduationCap,
  TreePine,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { AboutPageContent, ImpactCard } from "@/lib/types/about";
import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";
import AboutPageContentComponent from "@/app/about/AboutPageContent";

interface AboutPageData {
  aboutPageContent: AboutPageContent;
}

export default function EditAboutPage() {
  const [data, setData] = useState<AboutPageData | null>(null);
  const [originalData, setOriginalData] = useState<AboutPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localImage, setLocalImage] = useState<{
    file: File;
    localUrl: string;
  } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [iconDialogOpen, setIconDialogOpen] = useState<number | null>(null);

  // Available icons for selection with actual Lucide components
  const availableIcons = [
    { key: "tent", icon: Tent, label: "Tent" },
    { key: "users", icon: Users, label: "Users" },
    { key: "volleyball", icon: Volleyball, label: "Volleyball" },
    { key: "rainbow", icon: Rainbow, label: "Rainbow" },
    { key: "heart", icon: Heart, label: "Heart" },
    { key: "star", icon: Star, label: "Star" },
    { key: "lightbulb", icon: Lightbulb, label: "Lightbulb" },
    { key: "book", icon: BookOpen, label: "Book" },
    { key: "graduation-cap", icon: GraduationCap, label: "Graduation" },
    { key: "tree", icon: TreePine, label: "Tree" },
    { key: "sun", icon: Sun, label: "Sun" },
    { key: "moon", icon: Moon, label: "Moon" },
  ];

  useEffect(() => {
    loadAboutPageData();
  }, []);

  useEffect(() => {
    if (data && originalData) {
      const dataChanged = JSON.stringify(data) !== JSON.stringify(originalData);
      const imageChanged = localImage !== null;
      const changed = dataChanged || imageChanged;
      setHasChanges(changed);
    }
  }, [data, originalData, localImage]);

  const loadAboutPageData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/firestore/document?path=pages/about");

      if (!response.ok) throw new Error("Failed to fetch about page data");

      const aboutData = await response.json();
      const aboutPageContent = aboutData || null;

      console.log("aboutPageContent", aboutPageContent);

      if (aboutPageContent) {
        // Load image URL if image path exists
        if (
          aboutPageContent.image &&
          !aboutPageContent.image.startsWith("http") &&
          !aboutPageContent.image.startsWith("blob:")
        ) {
          await loadImageUrl(aboutPageContent.image);
        }
      }

      const pageData = { aboutPageContent };
      setData(pageData);
      setOriginalData(JSON.parse(JSON.stringify(pageData)));
    } catch (err) {
      setError("Failed to load about page data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadImageUrl = async (imagePath: string) => {
    try {
      const auth = getAuth(getFirebaseApp());
      const user = auth.currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();
      const response = await fetch(
        `/api/storage/url?path=${encodeURIComponent(imagePath)}`,
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setImageUrl(result.url);
        console.log("imageUrl", result.url);
      }
    } catch (err) {
      console.error("Failed to load image URL:", err);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setUploadingImage(true);

      // Create local URL for immediate preview
      const localUrl = URL.createObjectURL(file);

      // Store the file and local URL locally
      setLocalImage({ file, localUrl });
    } catch (err) {
      console.error("Failed to process image:", err);
      setError("Failed to process image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleSave = async () => {
    if (!data) return;

    try {
      setSaving(true);
      setError(null);

      const auth = getAuth(getFirebaseApp());
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
      const idToken = await user.getIdToken();

      let updatedImagePath = data.aboutPageContent.image;

      // Upload local image to Google Cloud if one was uploaded
      if (localImage) {
        const formData = new FormData();
        formData.append("file", localImage.file);
        formData.append("path", "about/main-image");

        const uploadResponse = await fetch("/api/storage/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload image");

        const uploadResult = await uploadResponse.json();
        updatedImagePath = uploadResult.path;
      }

      // Save updated data with cloud image path to new path
      const updatedContent = {
        ...data.aboutPageContent,
        image: updatedImagePath,
      };

      await fetch("/api/firestore/document?path=pages/about", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...updatedContent,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: user.uid,
          updatedBy: user.uid,
        }),
      });

      // Clean up local image
      if (localImage) {
        URL.revokeObjectURL(localImage.localUrl);
        setLocalImage(null);
      }

      // Update data with cloud path
      const dataWithCloudImage = {
        aboutPageContent: updatedContent,
      };

      setOriginalData(JSON.parse(JSON.stringify(dataWithCloudImage)));
      setData(dataWithCloudImage);
      setHasChanges(false);
    } catch (err) {
      setError("Failed to save changes");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    // Clean up local image
    if (localImage) {
      URL.revokeObjectURL(localImage.localUrl);
      setLocalImage(null);
    }

    setData(JSON.parse(JSON.stringify(originalData)));
    setHasChanges(false);
  };

  const updateField = (field: keyof AboutPageContent, value: string) => {
    if (!data) return;
    setData({
      ...data,
      aboutPageContent: { ...data.aboutPageContent, [field]: value },
    });
  };

  const updateImpactCard = (
    index: number,
    field: keyof ImpactCard,
    value: string
  ) => {
    if (!data) return;
    const updatedCards = [...data.aboutPageContent.impactCards];
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    setData({
      ...data,
      aboutPageContent: { ...data.aboutPageContent, impactCards: updatedCards },
    });
  };

  const addImpactCard = () => {
    if (!data) return;
    const newCard: ImpactCard = {
      icon: "tent",
      text: "New impact area",
      link: "/",
    };
    setData({
      ...data,
      aboutPageContent: {
        ...data.aboutPageContent,
        impactCards: [...data.aboutPageContent.impactCards, newCard],
      },
    });
  };

  const removeImpactCard = (index: number) => {
    if (!data) return;
    const updatedCards = data.aboutPageContent.impactCards.filter(
      (_, i) => i !== index
    );
    setData({
      ...data,
      aboutPageContent: { ...data.aboutPageContent, impactCards: updatedCards },
    });
  };

  const selectIcon = (index: number, iconKey: string) => {
    updateImpactCard(index, "icon", iconKey);
    setIconDialogOpen(null);
  };

  if (loading) {
    return (
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
                  Edit About Page
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading about page data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
                  Edit About Page
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
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
                  Edit About Page
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
            {/* Basic Content */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Basic Content
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={data.aboutPageContent.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mission Section Text
                  </label>
                  <textarea
                    value={data.aboutPageContent.missionSectionText}
                    onChange={(e) =>
                      updateField("missionSectionText", e.target.value)
                    }
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Main Image */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Main Image
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fileInput = document.getElementById(
                        "main-image-input"
                      ) as HTMLInputElement;
                      fileInput?.click();
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {localImage ? "Change Image" : "Upload Image"}
                  </button>
                  <input
                    id="main-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {uploadingImage && (
                  <p className="text-sm text-gray-500">Uploading...</p>
                )}
                {/* Show existing cloud image if no local image is being uploaded */}
                {!localImage && data.aboutPageContent.image && imageUrl && (
                  <div className="mt-2">
                    <div className="mb-2">
                      <img
                        src={imageUrl}
                        alt="Current main image"
                        className="w-40 h-24 object-cover rounded border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      <span>Cloud: {data.aboutPageContent.image}</span>
                    </div>
                  </div>
                )}
                {/* Show local image preview when uploading */}
                {localImage && (
                  <div className="mt-2">
                    <div className="mb-2">
                      <img
                        src={localImage.localUrl}
                        alt="Local image preview"
                        className="w-40 h-24 object-cover rounded border border-gray-300"
                      />
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      <span>Local: {localImage.file.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Impact Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Impact Section
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Impact Header
                  </label>
                  <input
                    type="text"
                    value={data.aboutPageContent.impactHeader}
                    onChange={(e) =>
                      updateField("impactHeader", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Impact Subheader
                  </label>
                  <input
                    type="text"
                    value={data.aboutPageContent.impactSubheader}
                    onChange={(e) =>
                      updateField("impactSubheader", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Impact Footer
                  </label>
                  <textarea
                    value={data.aboutPageContent.impactFooter}
                    onChange={(e) =>
                      updateField("impactFooter", e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Impact Cards */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Impact Cards
                </h2>
                <button
                  onClick={addImpactCard}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Card
                </button>
              </div>

              <div className="space-y-4">
                {data.aboutPageContent.impactCards.map((card, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">
                        Impact Card {index + 1}
                      </h3>
                      <button
                        onClick={() => removeImpactCard(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Icon
                        </label>
                        <button
                          type="button"
                          onClick={() => setIconDialogOpen(index)}
                          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <span className="flex items-center">
                            <span className="mr-2">
                              {(() => {
                                const IconComponent =
                                  availableIcons.find(
                                    (icon) => icon.key === card.icon
                                  )?.icon || AlertCircle;
                                return <IconComponent className="h-5 w-5" />;
                              })()}
                            </span>
                            <span className="text-gray-700">
                              {availableIcons.find(
                                (icon) => icon.key === card.icon
                              )?.label || card.icon}
                            </span>
                          </span>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>

                      {/* Icon Selection Dialog */}
                      {iconDialogOpen === index && (
                        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Select Icon
                              </h3>
                            </div>
                            <div className="p-6">
                              <div className="grid grid-cols-3 gap-3">
                                {availableIcons.map((iconOption) => {
                                  const IconComponent = iconOption.icon;
                                  return (
                                    <button
                                      key={iconOption.key}
                                      onClick={() =>
                                        selectIcon(index, iconOption.key)
                                      }
                                      className={`p-4 rounded-lg border-2 transition-colors ${
                                        card.icon === iconOption.key
                                          ? "border-primary bg-primary/10"
                                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                      }`}
                                    >
                                      <div className="text-center">
                                        <div className="mb-2 flex justify-center">
                                          <IconComponent className="h-8 w-8" />
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          {iconOption.label}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-200">
                              <button
                                onClick={() => setIconDialogOpen(null)}
                                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Text
                        </label>
                        <input
                          type="text"
                          value={card.text}
                          onChange={(e) =>
                            updateImpactCard(index, "text", e.target.value)
                          }
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
                            updateImpactCard(index, "link", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
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
              <AboutPageContentComponent
                aboutPageContent={{
                  ...data.aboutPageContent,
                  // Use local image URL if available, otherwise use cloud URL
                  image:
                    localImage?.localUrl ||
                    imageUrl ||
                    data.aboutPageContent.image,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
