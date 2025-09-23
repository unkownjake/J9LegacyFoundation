"use client";

import { useState, useEffect } from "react";
import { Save, ArrowLeft, AlertCircle, Eye, X } from "lucide-react";
import Link from "next/link";
import { EventsPageContent } from "@/lib/types/eventsPage";
import { defaultEventsPageContent } from "@/lib/defaults/eventsPageDefaults";
import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";
import EventsPage from "@/app/events/EventsPageContent";

interface EventsPageData {
  eventsPageContent: EventsPageContent;
}

export default function EditEventsPage() {
  const [data, setData] = useState<EventsPageData | null>(null);
  const [originalData, setOriginalData] = useState<EventsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "/api/firestore/collection?collection=eventsPage"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch events page data");
        }
        const eventsData = await response.json();

        // Use first document if exists, otherwise use defaults
        const eventsPageContent =
          eventsData && eventsData.length > 0
            ? eventsData[0]
            : defaultEventsPageContent;

        const result = { eventsPageContent };
        setData(result);
        setOriginalData(JSON.parse(JSON.stringify(result))); // Deep clone
      } catch (error) {
        console.error("Error fetching events page data:", error);
        setError("Failed to load events page data");
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
        "/api/firestore/collection?collection=eventsPage",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      if (!clearResponse.ok) {
        throw new Error("Failed to clear events page data");
      }

      // Add updated data
      await fetch("/api/firestore/document?collection=eventsPage&id=events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data.eventsPageContent,
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
      console.error("Error saving events page data:", error);
      setError("Failed to save changes");
    } finally {
      setSaving(false);
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
                  Edit Events Page
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events page data...</p>
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
                  Edit Events Page
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load events page data</p>
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
                  Preview Events Page
                </h1>
              </div>
            </div>
          </div>
        </div>
        <EventsPage
          eventsPageContent={data.eventsPageContent}
          eventsData={{
            upcomingEvents: [
              {
                id: "mock-1",
                title: "Sample Upcoming Event",
                description:
                  "This is a sample upcoming event for preview purposes.",
                shortDescription: "Sample upcoming event description.",
                schedule: {
                  startTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
                  endTime:
                    Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000, // 2 hours later
                },
                location: {
                  name: "Sample Venue",
                  address: "123 Main St",
                  city: "Sample City",
                  state: "CA",
                  zipCode: "12345",
                },
                registration: {
                  type: "required",
                  cost: 25,
                  maxCapacity: 50,
                  currentCapacity: 0,
                },
                content: {
                  whatToBring: [],
                  highlights: ["Sample highlight"],
                },
                contact: {
                  organizerName: "Sample Contact",
                  organizerEmail: "contact@example.com",
                  organizerPhone: "(555) 123-4567",
                },
                media: {
                  imageUrl:
                    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
                  resources: [],
                },
                tags: ["Sample", "Preview"],
                slug: "sample-upcoming-event",
                responseSummary: {
                  totalParticipants: 0,
                  totalResponses: 0,
                },
              },
            ],
            pastEvents: [
              {
                id: "mock-2",
                title: "Sample Past Event",
                description:
                  "This is a sample past event for preview purposes.",
                shortDescription: "Sample past event description.",
                schedule: {
                  startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
                  endTime:
                    Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000, // 2 hours later
                },
                location: {
                  name: "Sample Venue",
                  address: "123 Main St",
                  city: "Sample City",
                  state: "CA",
                  zipCode: "12345",
                },
                registration: {
                  type: "required",
                  cost: 25,
                  maxCapacity: 50,
                  currentCapacity: 0,
                },
                content: {
                  whatToBring: [],
                  highlights: ["Sample highlight"],
                },
                contact: {
                  organizerName: "Sample Contact",
                  organizerEmail: "contact@example.com",
                  organizerPhone: "(555) 123-4567",
                },
                media: {
                  imageUrl:
                    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
                  resources: [],
                },
                tags: ["Sample", "Preview"],
                slug: "sample-past-event",
                responseSummary: {
                  totalParticipants: 0,
                  totalResponses: 0,
                },
                postEventContent: {
                  thankYouMessage: "Thank you for attending our sample event!",
                  participantCount: 25,
                  fundsRaised: 625,
                  eventHighlights: [
                    "Great turnout",
                    "Amazing community spirit",
                  ],
                },
              },
            ],
          }}
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
                Edit Events Page
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
                  Page Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={data.eventsPageContent.title}
                  onChange={(e) =>
                    setData({
                      ...data,
                      eventsPageContent: {
                        ...data.eventsPageContent,
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
                  Page Subtitle
                </label>
                <textarea
                  id="subtitle"
                  rows={3}
                  value={data.eventsPageContent.subtitle}
                  onChange={(e) =>
                    setData({
                      ...data,
                      eventsPageContent: {
                        ...data.eventsPageContent,
                        subtitle: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section Visibility */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Section Visibility
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showUpcomingSection"
                  checked={data.eventsPageContent.showUpcomingSection}
                  onChange={(e) =>
                    setData({
                      ...data,
                      eventsPageContent: {
                        ...data.eventsPageContent,
                        showUpcomingSection: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="showUpcomingSection"
                  className="ml-2 text-sm text-gray-700"
                >
                  Show Upcoming Events Section
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPastSection"
                  checked={data.eventsPageContent.showPastSection}
                  onChange={(e) =>
                    setData({
                      ...data,
                      eventsPageContent: {
                        ...data.eventsPageContent,
                        showPastSection: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="showPastSection"
                  className="ml-2 text-sm text-gray-700"
                >
                  Show Past Events Section
                </label>
              </div>
            </div>
          </div>

          {/* Section Titles */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Section Titles
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="upcomingSectionTitle"
                  className="block text-sm font-medium text-gray-700"
                >
                  Upcoming Events Section Title
                </label>
                <input
                  type="text"
                  id="upcomingSectionTitle"
                  value={data.eventsPageContent.upcomingSectionTitle}
                  onChange={(e) =>
                    setData({
                      ...data,
                      eventsPageContent: {
                        ...data.eventsPageContent,
                        upcomingSectionTitle: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="pastSectionTitle"
                  className="block text-sm font-medium text-gray-700"
                >
                  Past Events Section Title
                </label>
                <input
                  type="text"
                  id="pastSectionTitle"
                  value={data.eventsPageContent.pastSectionTitle}
                  onChange={(e) =>
                    setData({
                      ...data,
                      eventsPageContent: {
                        ...data.eventsPageContent,
                        pastSectionTitle: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* No Events Message */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              No Events Message
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="noEventsMessage"
                  className="block text-sm font-medium text-gray-700"
                >
                  No Events Message
                </label>
                <input
                  type="text"
                  id="noEventsMessage"
                  value={data.eventsPageContent.noEventsMessage}
                  onChange={(e) =>
                    setData({
                      ...data,
                      eventsPageContent: {
                        ...data.eventsPageContent,
                        noEventsMessage: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="noEventsSubtitle"
                  className="block text-sm font-medium text-gray-700"
                >
                  No Events Subtitle
                </label>
                <input
                  type="text"
                  id="noEventsSubtitle"
                  value={data.eventsPageContent.noEventsSubtitle}
                  onChange={(e) =>
                    setData({
                      ...data,
                      eventsPageContent: {
                        ...data.eventsPageContent,
                        noEventsSubtitle: e.target.value,
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
