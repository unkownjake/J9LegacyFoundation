"use client";

import { useState, useEffect } from "react";
import {
  Save,
  X,
  ArrowLeft,
  AlertCircle,
  Eye,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { PersonalGrowthContent } from "@/lib/types/personalGrowth";
import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";
import PersonalGrowthPageComponent from "@/app/about/personal-growth/PersonalGrowthPageContent";

interface PersonalGrowthPageData {
  personalGrowthContent: PersonalGrowthContent;
}

export default function EditPersonalGrowthPage() {
  const [data, setData] = useState<PersonalGrowthPageData | null>(null);
  const [originalData, setOriginalData] =
    useState<PersonalGrowthPageData | null>(null);
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
    loadPersonalGrowthData();
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

  const loadPersonalGrowthData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/firestore/document?path=pages/about/subpages/personalGrowth"
      );

      if (!response.ok)
        throw new Error("Failed to fetch personal growth page data");

      const personalGrowthData = await response.json();
      const personalGrowthContent = personalGrowthData || null;

      const pageData = { personalGrowthContent };
      setData(pageData);
      setOriginalData(JSON.parse(JSON.stringify(pageData)));
    } catch (err) {
      setError("Failed to load personal growth page data");
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

      // Fetch URL for the image
      if (
        data.personalGrowthContent.image &&
        !data.personalGrowthContent.image.startsWith("blob:") &&
        !data.personalGrowthContent.image.startsWith("http")
      ) {
        try {
          const response = await fetch(
            `/api/storage/url?path=${encodeURIComponent(
              data.personalGrowthContent.image
            )}`,
            {
              headers: { Authorization: `Bearer ${idToken}` },
            }
          );

          if (response.ok) {
            const result = await response.json();
            newImageUrls.image = result.url;
          }
        } catch (err) {
          console.error(
            `Failed to get URL for ${data.personalGrowthContent.image}:`,
            err
          );
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
      const updatedContent = { ...data.personalGrowthContent };
      for (const [imageKey, localImage] of Object.entries(localImages)) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", localImage.file);
        formData.append("path", `personal-growth/${imageKey}`);

        const uploadResponse = await fetch("/api/storage/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload image");

        const uploadResult = await uploadResponse.json();
        const cloudImagePath = uploadResult.path; // Use the path, not downloadURL

        // Update the content with the cloud path
        updatedContent[imageKey as keyof PersonalGrowthContent] =
          cloudImagePath;
      }

      // Update data with cloud paths
      const dataWithCloudImages = {
        ...data,
        personalGrowthContent: updatedContent,
      };

      // Save to new path
      await fetch(
        "/api/firestore/document?path=pages/about/subpages/personalGrowth",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...dataWithCloudImages.personalGrowthContent,
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

  const updateField = (field: keyof PersonalGrowthContent, value: string) => {
    if (!data) return;
    setData({
      ...data,
      personalGrowthContent: {
        ...data.personalGrowthContent,
        [field]: value,
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
                  Edit Personal Growth Page
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
              Loading personal growth page data...
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
                  Edit Personal Growth Page
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
                  Edit Personal Growth Page
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
                        value={data.personalGrowthContent.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Intro Text */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Intro Text
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text
                    </label>
                    <textarea
                      value={data.personalGrowthContent.introText}
                      onChange={(e) => updateField("introText", e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Building Confidence */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Building Confidence
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Header
                      </label>
                      <input
                        type="text"
                        value={data.personalGrowthContent.confidenceHeader}
                        onChange={(e) =>
                          updateField("confidenceHeader", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text
                      </label>
                      <textarea
                        value={data.personalGrowthContent.confidenceText}
                        onChange={(e) =>
                          updateField("confidenceText", e.target.value)
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Friendship */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Friendship & Belonging
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Header
                      </label>
                      <input
                        type="text"
                        value={data.personalGrowthContent.friendshipHeader}
                        onChange={(e) =>
                          updateField("friendshipHeader", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text
                      </label>
                      <textarea
                        value={data.personalGrowthContent.friendshipText}
                        onChange={(e) =>
                          updateField("friendshipText", e.target.value)
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Joy */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Joy & Memories
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Header
                      </label>
                      <input
                        type="text"
                        value={data.personalGrowthContent.joyHeader}
                        onChange={(e) =>
                          updateField("joyHeader", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text
                      </label>
                      <textarea
                        value={data.personalGrowthContent.joyText}
                        onChange={(e) => updateField("joyText", e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
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
                      value={data.personalGrowthContent.conclusion}
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
                {/* Image */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Image
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById(
                            "image-input"
                          ) as HTMLInputElement;
                          fileInput?.click();
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {localImages.image ? "Change Image" : "Upload Image"}
                      </button>
                      <input
                        id="image-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange("image", e)}
                        className="hidden"
                      />
                    </div>
                    {uploadingImages.image && (
                      <p className="text-sm text-gray-500">Uploading...</p>
                    )}
                    {/* Show existing cloud image if no local image is being uploaded */}
                    {!localImages.image &&
                      data.personalGrowthContent.image &&
                      imageUrls.image && (
                        <div className="mt-2">
                          <div className="mb-2">
                            <img
                              src={imageUrls.image}
                              alt="Personal Growth"
                              className="w-32 h-24 object-cover rounded border border-gray-300"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <ImageIcon className="h-4 w-4 mr-1" />
                            <span>
                              Cloud: {data.personalGrowthContent.image}
                            </span>
                          </div>
                        </div>
                      )}
                    {/* Show local image preview when uploading */}
                    {localImages.image && (
                      <div className="mt-2">
                        <div className="mb-2">
                          <img
                            src={localImages.image.localUrl}
                            alt="Personal Growth"
                            className="w-32 h-24 object-cover rounded border border-gray-300"
                          />
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <ImageIcon className="h-4 w-4 mr-1" />
                          <span>Local: {localImages.image.file.name}</span>
                        </div>
                      </div>
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
              <PersonalGrowthPageComponent
                personalGrowthContent={{
                  ...data.personalGrowthContent,
                  // Use local image URL if available, otherwise use cloud URL
                  image:
                    localImages.image?.localUrl ||
                    imageUrls.image ||
                    data.personalGrowthContent.image,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
