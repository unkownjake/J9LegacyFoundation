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
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import {
  SponsorshipApplicationContent,
  ApplicationRequirement,
  ImportantInfo,
} from "@/lib/types/sponsorshipApplication";
import { defaultSponsorshipApplicationContent } from "@/lib/defaults/sponsorshipApplicationDefaults";
import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";
import SponsorshipApplicationPage from "@/app/sponsorship-application/SponsorshipApplicationPageContent";

interface SponsorshipApplicationPageData {
  sponsorshipApplicationContent: SponsorshipApplicationContent;
}

export default function EditSponsorshipApplicationPage() {
  const [data, setData] = useState<SponsorshipApplicationPageData | null>(null);
  const [originalData, setOriginalData] =
    useState<SponsorshipApplicationPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedRequirementIndex, setDraggedRequirementIndex] = useState<
    number | null
  >(null);
  const [draggedInfoIndex, setDraggedInfoIndex] = useState<number | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "/api/firestore/collection?collection=sponsorshipApplicationPage"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch sponsorship application data");
        }
        const appData = await response.json();

        // Use first document if exists, otherwise use defaults
        const sponsorshipApplicationContent =
          appData && appData.length > 0
            ? appData[0]
            : defaultSponsorshipApplicationContent;

        const result = { sponsorshipApplicationContent };
        setData(result);
        setOriginalData(JSON.parse(JSON.stringify(result))); // Deep clone
      } catch (error) {
        console.error("Error fetching sponsorship application data:", error);
        setError("Failed to load sponsorship application data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check for changes whenever data changes
  useEffect(() => {
    if (data && originalData) {
      const hasChanges = JSON.stringify(data) !== JSON.stringify(originalData);
      setHasChanges(hasChanges);
    }
  }, [data, originalData]);

  const handleSave = async () => {
    if (!data) return;

    setSaving(true);
    setError(null);

    try {
      const auth = getAuth(getFirebaseApp());
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
      const idToken = await user.getIdToken();

      // Clear existing data
      const clearResponse = await fetch(
        "/api/firestore/collection?collection=sponsorshipApplicationPage",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      if (!clearResponse.ok) {
        throw new Error("Failed to clear sponsorship application data");
      }

      // Add updated data
      await fetch(
        "/api/firestore/document?collection=sponsorshipApplicationPage&id=sponsorship",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data.sponsorshipApplicationContent,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            createdBy: user.uid,
            updatedBy: user.uid,
          }),
        }
      );

      setOriginalData(JSON.parse(JSON.stringify(data))); // Update original data
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving sponsorship application data:", error);
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const addRequirement = () => {
    if (!data) return;

    const newRequirement: ApplicationRequirement = {
      text: "",
    };

    setData({
      ...data,
      sponsorshipApplicationContent: {
        ...data.sponsorshipApplicationContent,
        applicationRequirements: [
          ...data.sponsorshipApplicationContent.applicationRequirements,
          newRequirement,
        ],
      },
    });
  };

  const removeRequirement = (index: number) => {
    if (!data) return;

    const newRequirements =
      data.sponsorshipApplicationContent.applicationRequirements.filter(
        (_, i) => i !== index
      );

    setData({
      ...data,
      sponsorshipApplicationContent: {
        ...data.sponsorshipApplicationContent,
        applicationRequirements: newRequirements,
      },
    });
  };

  const updateRequirement = (index: number, text: string) => {
    if (!data) return;

    const newRequirements = [
      ...data.sponsorshipApplicationContent.applicationRequirements,
    ];
    newRequirements[index] = { ...newRequirements[index], text };

    setData({
      ...data,
      sponsorshipApplicationContent: {
        ...data.sponsorshipApplicationContent,
        applicationRequirements: newRequirements,
      },
    });
  };

  const addImportantInfo = () => {
    if (!data) return;

    const newInfo: ImportantInfo = {
      text: "",
    };

    setData({
      ...data,
      sponsorshipApplicationContent: {
        ...data.sponsorshipApplicationContent,
        importantInfoItems: [
          ...data.sponsorshipApplicationContent.importantInfoItems,
          newInfo,
        ],
      },
    });
  };

  const removeImportantInfo = (index: number) => {
    if (!data) return;

    const newInfoItems =
      data.sponsorshipApplicationContent.importantInfoItems.filter(
        (_, i) => i !== index
      );

    setData({
      ...data,
      sponsorshipApplicationContent: {
        ...data.sponsorshipApplicationContent,
        importantInfoItems: newInfoItems,
      },
    });
  };

  const updateImportantInfo = (index: number, text: string) => {
    if (!data) return;

    const newInfoItems = [
      ...data.sponsorshipApplicationContent.importantInfoItems,
    ];
    newInfoItems[index] = { ...newInfoItems[index], text };

    setData({
      ...data,
      sponsorshipApplicationContent: {
        ...data.sponsorshipApplicationContent,
        importantInfoItems: newInfoItems,
      },
    });
  };

  const moveRequirement = (fromIndex: number, toIndex: number) => {
    if (!data) return;

    const newRequirements = [
      ...data.sponsorshipApplicationContent.applicationRequirements,
    ];
    const [movedRequirement] = newRequirements.splice(fromIndex, 1);
    newRequirements.splice(toIndex, 0, movedRequirement);

    setData({
      ...data,
      sponsorshipApplicationContent: {
        ...data.sponsorshipApplicationContent,
        applicationRequirements: newRequirements,
      },
    });
  };

  const moveImportantInfo = (fromIndex: number, toIndex: number) => {
    if (!data) return;

    const newInfoItems = [
      ...data.sponsorshipApplicationContent.importantInfoItems,
    ];
    const [movedInfo] = newInfoItems.splice(fromIndex, 1);
    newInfoItems.splice(toIndex, 0, movedInfo);

    setData({
      ...data,
      sponsorshipApplicationContent: {
        ...data.sponsorshipApplicationContent,
        importantInfoItems: newInfoItems,
      },
    });
  };

  const handleRequirementDragStart = (index: number) => {
    setDraggedRequirementIndex(index);
  };

  const handleImportantInfoDragStart = (index: number) => {
    setDraggedInfoIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRequirementDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (
      draggedRequirementIndex !== null &&
      draggedRequirementIndex !== dropIndex
    ) {
      moveRequirement(draggedRequirementIndex, dropIndex);
    }
    setDraggedRequirementIndex(null);
  };

  const handleImportantInfoDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedInfoIndex !== null && draggedInfoIndex !== dropIndex) {
      moveImportantInfo(draggedInfoIndex, dropIndex);
    }
    setDraggedInfoIndex(null);
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
                  Edit Sponsorship Application Page
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
              Loading sponsorship application data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
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
                  Edit Sponsorship Application Page
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Failed to load sponsorship application data
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setShowPreview(false)}
                  className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-medium text-gray-900">
                  Preview Sponsorship Application Page
                </h1>
              </div>
            </div>
          </div>
        </div>
        <SponsorshipApplicationPage
          sponsorshipApplicationContent={data.sponsorshipApplicationContent}
        />
      </div>
    );
  }

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
                Edit Sponsorship Application Page
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <>
                  <button
                    onClick={() => {
                      setData(JSON.parse(JSON.stringify(originalData)));
                      setHasChanges(false);
                    }}
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

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Page Header
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={data.sponsorshipApplicationContent.title}
                  onChange={(e) =>
                    setData({
                      ...data,
                      sponsorshipApplicationContent: {
                        ...data.sponsorshipApplicationContent,
                        title: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="subtitle"
                  className="block text-sm font-medium text-gray-700"
                >
                  Subtitle
                </label>
                <textarea
                  id="subtitle"
                  rows={3}
                  value={data.sponsorshipApplicationContent.subtitle}
                  onChange={(e) =>
                    setData({
                      ...data,
                      sponsorshipApplicationContent: {
                        ...data.sponsorshipApplicationContent,
                        subtitle: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Application Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Application Section
            </h2>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="applicationHeader"
                  className="block text-sm font-medium text-gray-700"
                >
                  Application Header
                </label>
                <input
                  type="text"
                  id="applicationHeader"
                  value={data.sponsorshipApplicationContent.applicationHeader}
                  onChange={(e) =>
                    setData({
                      ...data,
                      sponsorshipApplicationContent: {
                        ...data.sponsorshipApplicationContent,
                        applicationHeader: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="applicationDescription"
                  className="block text-sm font-medium text-gray-700"
                >
                  Application Description
                </label>
                <textarea
                  id="applicationDescription"
                  rows={3}
                  value={
                    data.sponsorshipApplicationContent.applicationDescription
                  }
                  onChange={(e) =>
                    setData({
                      ...data,
                      sponsorshipApplicationContent: {
                        ...data.sponsorshipApplicationContent,
                        applicationDescription: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="sponsorshipLimit"
                  className="block text-sm font-medium text-gray-700"
                >
                  Sponsorship Limit
                </label>
                <input
                  type="text"
                  id="sponsorshipLimit"
                  value={data.sponsorshipApplicationContent.sponsorshipLimit}
                  onChange={(e) =>
                    setData({
                      ...data,
                      sponsorshipApplicationContent: {
                        ...data.sponsorshipApplicationContent,
                        sponsorshipLimit: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Application Requirements */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Application Requirements
              </h2>
              <button
                onClick={addRequirement}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Requirement
              </button>
            </div>

            <div className="space-y-4">
              {data.sponsorshipApplicationContent.applicationRequirements.map(
                (requirement, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleRequirementDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleRequirementDrop(e, index)}
                    className={`border rounded-lg p-4 ${
                      draggedRequirementIndex === index ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 pt-2">
                        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">
                            Requirement #{index + 1}
                          </span>
                          <button
                            onClick={() => removeRequirement(index)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={requirement.text}
                          onChange={(e) =>
                            updateRequirement(index, e.target.value)
                          }
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                          placeholder="Enter requirement text..."
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {data.sponsorshipApplicationContent.applicationRequirements
              .length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No requirements added yet. Click "Add Requirement" to get
                  started.
                </p>
              </div>
            )}
          </div>

          {/* Important Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Important Information
              </h2>
              <button
                onClick={addImportantInfo}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Info Item
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="importantInfoHeader"
                  className="block text-sm font-medium text-gray-700"
                >
                  Important Info Header
                </label>
                <input
                  type="text"
                  id="importantInfoHeader"
                  value={data.sponsorshipApplicationContent.importantInfoHeader}
                  onChange={(e) =>
                    setData({
                      ...data,
                      sponsorshipApplicationContent: {
                        ...data.sponsorshipApplicationContent,
                        importantInfoHeader: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>

              <div className="space-y-4">
                {data.sponsorshipApplicationContent.importantInfoItems.map(
                  (info, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleImportantInfoDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleImportantInfoDrop(e, index)}
                      className={`border rounded-lg p-4 ${
                        draggedInfoIndex === index ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 pt-2">
                          <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              Info Item #{index + 1}
                            </span>
                            <button
                              onClick={() => removeImportantInfo(index)}
                              className="p-1 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={info.text}
                            onChange={(e) =>
                              updateImportantInfo(index, e.target.value)
                            }
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="Enter information text..."
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {data.sponsorshipApplicationContent.importantInfoItems.length ===
              0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No info items added yet. Click "Add Info Item" to get started.
                </p>
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Call to Action
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="ctaText"
                  className="block text-sm font-medium text-gray-700"
                >
                  CTA Text
                </label>
                <input
                  type="text"
                  id="ctaText"
                  value={data.sponsorshipApplicationContent.ctaText}
                  onChange={(e) =>
                    setData({
                      ...data,
                      sponsorshipApplicationContent: {
                        ...data.sponsorshipApplicationContent,
                        ctaText: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="ctaLink"
                  className="block text-sm font-medium text-gray-700"
                >
                  CTA Link
                </label>
                <input
                  type="text"
                  id="ctaLink"
                  value={data.sponsorshipApplicationContent.ctaLink}
                  onChange={(e) =>
                    setData({
                      ...data,
                      sponsorshipApplicationContent: {
                        ...data.sponsorshipApplicationContent,
                        ctaLink: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
