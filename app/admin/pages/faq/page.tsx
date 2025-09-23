"use client";

import { useState, useEffect } from "react";
import {
  Save,
  ArrowLeft,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  X,
} from "lucide-react";
import Link from "next/link";
import { FAQPageContent, FAQ } from "@/lib/types/faq";
import { defaultFAQPageContent } from "@/lib/defaults/faqDefaults";
import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";
import FAQPage from "@/app/faq/FAQPageContent";
import SortableList from "@/components/ui/SortableList";

interface FAQPageData {
  faqPageContent: FAQPageContent;
}

export default function EditFAQPage() {
  const [data, setData] = useState<FAQPageData | null>(null);
  const [originalData, setOriginalData] = useState<FAQPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/firestore/document?path=pages/faq");
        if (!response.ok) {
          throw new Error("Failed to fetch FAQ data");
        }
        const faqData = await response.json();

        // Use fetched data if exists, otherwise use defaults
        const faqPageContent = faqData || defaultFAQPageContent;

        const result = { faqPageContent };
        setData(result);
        setOriginalData(JSON.parse(JSON.stringify(result))); // Deep clone
      } catch (error) {
        console.error("Error fetching FAQ data:", error);
        setError("Failed to load FAQ data");
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

      // Save to new path structure
      await fetch("/api/firestore/document?path=pages/faq", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data.faqPageContent,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: user.uid,
          updatedBy: user.uid,
        }),
      });

      setOriginalData(JSON.parse(JSON.stringify(data))); // Update original data
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving FAQ data:", error);
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (originalData) {
      setData(JSON.parse(JSON.stringify(originalData)));
      setHasChanges(false);
    }
  };

  const addFAQ = (question: string) => {
    if (!data) return;

    const newFAQ: FAQ = {
      id: `faq-${Date.now()}`,
      question: question,
      answer: "",
      order: data.faqPageContent.faqs.length + 1,
      isActive: true,
    };

    setData({
      ...data,
      faqPageContent: {
        ...data.faqPageContent,
        faqs: [...data.faqPageContent.faqs, newFAQ],
      },
    });
  };

  const removeFAQ = (index: number, faq: FAQ) => {
    if (!data) return;

    const newFAQs = data.faqPageContent.faqs.filter((_, i) => i !== index);
    // Reorder remaining FAQs
    const reorderedFAQs = newFAQs.map((faq, i) => ({
      ...faq,
      order: i + 1,
    }));

    setData({
      ...data,
      faqPageContent: {
        ...data.faqPageContent,
        faqs: reorderedFAQs,
      },
    });
  };

  const updateFAQ = (
    index: number,
    field: keyof FAQ,
    value: string | boolean
  ) => {
    if (!data) return;

    const newFAQs = [...data.faqPageContent.faqs];
    newFAQs[index] = { ...newFAQs[index], [field]: value };

    setData({
      ...data,
      faqPageContent: {
        ...data.faqPageContent,
        faqs: newFAQs,
      },
    });
  };

  const reorderFAQs = (newOrder: number[]) => {
    if (!data) return;

    const reorderedFAQs = newOrder.map((oldIndex, newIndex) => ({
      ...data.faqPageContent.faqs[oldIndex],
      order: newIndex + 1,
    }));

    setData({
      ...data,
      faqPageContent: {
        ...data.faqPageContent,
        faqs: reorderedFAQs,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FAQ data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load FAQ data</p>
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
                  Preview FAQ Page
                </h1>
              </div>
            </div>
          </div>
        </div>
        <FAQPage faqPageContent={data.faqPageContent} />
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
                Edit FAQ Page
              </h1>
            </div>
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
          {/* Page Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Page Settings
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Page Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={data.faqPageContent.title || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      faqPageContent: {
                        ...data.faqPageContent,
                        title: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Page Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={data.faqPageContent.description || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      faqPageContent: {
                        ...data.faqPageContent,
                        description: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">FAQs</h2>

            <SortableList
              label=""
              placeholder="Enter FAQ question..."
              items={data.faqPageContent.faqs}
              onAdd={addFAQ}
              onDelete={removeFAQ}
              onOrderChange={reorderFAQs}
              renderItem={(faq: FAQ, index: number) => (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      FAQ #{index + 1}
                    </span>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={faq.isActive !== false}
                          onChange={(e) =>
                            updateFAQ(index, "isActive", e.target.checked)
                          }
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Active
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question
                    </label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) =>
                        updateFAQ(index, "question", e.target.value)
                      }
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Enter the question..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Answer
                    </label>
                    <textarea
                      rows={4}
                      value={faq.answer}
                      onChange={(e) =>
                        updateFAQ(index, "answer", e.target.value)
                      }
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Enter the answer..."
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Use line breaks to create paragraphs in the answer.
                    </p>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
