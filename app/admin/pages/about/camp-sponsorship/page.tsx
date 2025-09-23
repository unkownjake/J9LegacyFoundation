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
import {
  CampSponsorshipContent,
  CampSponsorship,
} from "@/lib/types/campSponsorship";
import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";
import CampSponsorshipPageComponent from "@/app/about/camp-sponsorship/CampSponsorshipPageContent";

interface CampSponsorshipPageData {
  campSponsorshipContent: CampSponsorshipContent;
}

export default function EditCampSponsorshipPage() {
  const [data, setData] = useState<CampSponsorshipPageData | null>(null);
  const [originalData, setOriginalData] =
    useState<CampSponsorshipPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<{
    [key: string]: boolean;
  }>({});
  const [localImages, setLocalImages] = useState<{
    [key: string]: { file: File; localUrl: string };
  }>({});
  const [imageUrls, setImageUrls] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    loadCampSponsorshipData();
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

  const loadCampSponsorshipData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/firestore/document?path=pages/about/subpages/campSponsorships"
      );

      if (!response.ok)
        throw new Error("Failed to fetch camp sponsorship page data");

      const campSponsorshipData = await response.json();
      const campSponsorshipContent = campSponsorshipData || null;

      const pageData = { campSponsorshipContent };
      setData(pageData);
      setOriginalData(JSON.parse(JSON.stringify(pageData)));
    } catch (err) {
      setError("Failed to load camp sponsorship page data");
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
      const newImageUrls: { [key: string]: string } = {};

      // Fetch URLs for both images
      const images = [
        { key: "heroImage", path: data.campSponsorshipContent.imageA },
        {
          key: "secondaryImage",
          path: data.campSponsorshipContent.imageB,
        },
      ];

      for (const image of images) {
        if (
          image.path &&
          !image.path.startsWith("blob:") &&
          !image.path.startsWith("http")
        ) {
          try {
            const response = await fetch(
              `/api/storage/url?path=${encodeURIComponent(image.path)}`,
              {
                headers: { Authorization: `Bearer ${idToken}` },
              }
            );

            if (response.ok) {
              const result = await response.json();
              newImageUrls[image.key] = result.url;
            }
          } catch (err) {
            console.error(`Failed to get URL for ${image.path}:`, err);
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

      const auth = getAuth(getFirebaseApp());
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
      const idToken = await user.getIdToken();

      // Upload local images to Google Cloud first
      const updatedContent = { ...data.campSponsorshipContent };
      for (const [imageKey, localImage] of Object.entries(localImages)) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", localImage.file);
        formData.append("path", `campSponsorship/${imageKey}`);

        const uploadResponse = await fetch("/api/storage/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload image");

        const uploadResult = await uploadResponse.json();
        const cloudImagePath = uploadResult.path; // Use the path, not downloadURL

        // Update the content with the cloud path
        updatedContent[imageKey as keyof CampSponsorshipContent] =
          cloudImagePath;
      }

      // Update data with cloud paths
      const dataWithCloudImages = {
        ...data,
        campSponsorshipContent: updatedContent,
      };

      // Save to new path
      await fetch(
        "/api/firestore/document?path=pages/about/subpages/campSponsorships",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...dataWithCloudImages.campSponsorshipContent,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            createdBy: user.uid,
            updatedBy: user.uid,
          }),
        }
      );

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

  const updateField = (field: keyof CampSponsorshipContent, value: string) => {
    if (!data) return;
    setData({
      ...data,
      campSponsorshipContent: {
        ...data.campSponsorshipContent,
        [field]: value,
      },
    });
  };

  const updateCampSponsorship = (
    index: number,
    field: keyof CampSponsorship,
    value: string
  ) => {
    if (!data) return;
    const updatedSponsorships = [
      ...data.campSponsorshipContent.campSponsorships,
    ];
    updatedSponsorships[index] = {
      ...updatedSponsorships[index],
      [field]: value,
    };
    setData({
      ...data,
      campSponsorshipContent: {
        ...data.campSponsorshipContent,
        campSponsorships: updatedSponsorships,
      },
    });
  };

  const addCampSponsorship = () => {
    if (!data) return;
    const newSponsorship: CampSponsorship = {
      name: "New Camp Sponsorship",
      description: "Camp sponsorship description",
    };
    setData({
      ...data,
      campSponsorshipContent: {
        ...data.campSponsorshipContent,
        campSponsorships: [
          ...data.campSponsorshipContent.campSponsorships,
          newSponsorship,
        ],
      },
    });
  };

  const removeCampSponsorship = (index: number) => {
    if (!data) return;
    const updatedSponsorships =
      data.campSponsorshipContent.campSponsorships.filter(
        (_, i) => i !== index
      );
    setData({
      ...data,
      campSponsorshipContent: {
        ...data.campSponsorshipContent,
        campSponsorships: updatedSponsorships,
      },
    });
  };

  const uploadImage = async (imageKey: string, file: File) => {
    if (!data || !file) return;

    try {
      setUploadingImages((prev) => ({ ...prev, [imageKey]: true }));

      // Create local URL for immediate preview
      const localUrl = URL.createObjectURL(file);

      // Store the file and local URL locally
      setLocalImages((prev) => ({
        ...prev,
        [imageKey]: { file, localUrl },
      }));
    } catch (err) {
      console.error("Failed to process image:", err);
      setError("Failed to process image");
    } finally {
      setUploadingImages((prev) => ({ ...prev, [imageKey]: false }));
    }
  };

  const handleImageChange = (
    imageKey: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(imageKey, file);
    }
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
                  Edit Camp Sponsorship Page
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">
              Loading camp sponsorship page data...
            </p>
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
                  Edit Camp Sponsorship Page
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
                  Edit Camp Sponsorship Page
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
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
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
                        value={data.campSponsorshipContent.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Info Title */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Info Title
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text
                    </label>
                    <textarea
                      value={data.campSponsorshipContent.infoTitle}
                      onChange={(e) => updateField("infoTitle", e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Mission */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Info Text
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text
                    </label>
                    <textarea
                      value={data.campSponsorshipContent.infoText}
                      onChange={(e) => updateField("infoText", e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Conclusion */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Conclusion
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text
                    </label>
                    <textarea
                      value={data.campSponsorshipContent.conclusion}
                      onChange={(e) =>
                        updateField("conclusion", e.target.value)
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Hero Image */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Hero Image
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById(
                            "hero-image-input"
                          ) as HTMLInputElement;
                          fileInput?.click();
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {localImages.heroImage
                          ? "Change Image"
                          : "Upload Image"}
                      </button>
                      <input
                        id="hero-image-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange("heroImage", e)}
                        className="hidden"
                      />
                    </div>
                    {uploadingImages.heroImage && (
                      <p className="text-sm text-gray-500">Uploading...</p>
                    )}
                    {/* Show existing cloud image if no local image is being uploaded */}
                    {!localImages.heroImage &&
                      data.campSponsorshipContent.imageA &&
                      imageUrls.heroImage && (
                        <div className="mt-2">
                          <div className="mb-2">
                            <img
                              src={imageUrls.heroImage}
                              alt="Hero"
                              className="w-32 h-24 object-cover rounded border border-gray-300"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <ImageIcon className="h-4 w-4 mr-1" />
                            <span>
                              Cloud: {data.campSponsorshipContent.imageA}
                            </span>
                          </div>
                        </div>
                      )}
                    {/* Show local image preview when uploading */}
                    {localImages.heroImage && (
                      <div className="mt-2">
                        <div className="mb-2">
                          <img
                            src={localImages.heroImage.localUrl}
                            alt="Hero"
                            className="w-32 h-24 object-cover rounded border border-gray-300"
                          />
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <ImageIcon className="h-4 w-4 mr-1" />
                          <span>Local: {localImages.heroImage.file.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Image */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Secondary Image
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById(
                            "secondary-image-input"
                          ) as HTMLInputElement;
                          fileInput?.click();
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {localImages.secondaryImage
                          ? "Change Image"
                          : "Upload Image"}
                      </button>
                      <input
                        id="secondary-image-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange("secondaryImage", e)}
                        className="hidden"
                      />
                    </div>
                    {uploadingImages.secondaryImage && (
                      <p className="text-sm text-gray-500">Uploading...</p>
                    )}
                    {/* Show existing cloud image if no local image is being uploaded */}
                    {!localImages.secondaryImage &&
                      data.campSponsorshipContent.imageB &&
                      imageUrls.secondaryImage && (
                        <div className="mt-2">
                          <div className="mb-2">
                            <img
                              src={imageUrls.secondaryImage}
                              alt="Secondary"
                              className="w-32 h-24 object-cover rounded border border-gray-300"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <ImageIcon className="h-4 w-4 mr-1" />
                            <span>
                              Cloud: {data.campSponsorshipContent.imageB}
                            </span>
                          </div>
                        </div>
                      )}
                    {/* Show local image preview when uploading */}
                    {localImages.secondaryImage && (
                      <div className="mt-2">
                        <div className="mb-2">
                          <img
                            src={localImages.secondaryImage.localUrl}
                            alt="Secondary"
                            className="w-32 h-24 object-cover rounded border border-gray-300"
                          />
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <ImageIcon className="h-4 w-4 mr-1" />
                          <span>
                            Local: {localImages.secondaryImage.file.name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Camp Sponsorships */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Camp Sponsorships
                    </h2>
                    <button
                      onClick={addCampSponsorship}
                      className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Sponsorship
                    </button>
                  </div>

                  <div className="space-y-4">
                    {data.campSponsorshipContent.campSponsorships.map(
                      (sponsorship, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-gray-900">
                              Sponsorship {index + 1}
                            </h3>
                            <button
                              onClick={() => removeCampSponsorship(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name
                              </label>
                              <input
                                type="text"
                                value={sponsorship.name}
                                onChange={(e) =>
                                  updateCampSponsorship(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={sponsorship.description}
                                onChange={(e) =>
                                  updateCampSponsorship(
                                    index,
                                    "description",
                                    e.target.value
                                  )
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL (optional)
                              </label>
                              <input
                                type="url"
                                value={sponsorship.url || ""}
                                onChange={(e) =>
                                  updateCampSponsorship(
                                    index,
                                    "url",
                                    e.target.value
                                  )
                                }
                                placeholder="https://example.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
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
              <CampSponsorshipPageComponent
                campSponsorshipContent={{
                  ...data.campSponsorshipContent,
                  // Use local image URLs if available, otherwise use cloud URLs
                  imageA:
                    localImages.heroImage?.localUrl ||
                    imageUrls.heroImage ||
                    data.campSponsorshipContent.imageA,
                  imageB:
                    localImages.secondaryImage?.localUrl ||
                    imageUrls.secondaryImage ||
                    data.campSponsorshipContent.imageB,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
