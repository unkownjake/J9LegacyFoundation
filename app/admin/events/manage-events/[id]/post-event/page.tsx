"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { EventPayload } from "@/lib/types/events";
import { useEventDetailContext } from "../layout";
import SortableList from "@/components/ui/SortableList";

export default function PostEventPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { setShowActionButtons, setOnCancel, setOnSubmit, setSaving } =
    useEventDetailContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EventPayload>>({});
  const [originalFormData, setOriginalFormData] =
    useState<Partial<EventPayload> | null>(null);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch event");
        }
        const result = await response.json();
        setFormData(result.event);
        setOriginalFormData(result.event);
      } catch (error) {
        console.error("Error fetching event:", error);
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  // Set up context for action buttons
  useEffect(() => {
    // Only set up context if we have loaded data and formData is not empty
    if (
      !originalFormData ||
      loading ||
      !formData ||
      Object.keys(formData).length === 0
    ) {
      setShowActionButtons(false);
      setOnCancel(null);
      setOnSubmit(null);
      return;
    }

    const hasChanges =
      JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setShowActionButtons(hasChanges);

    if (hasChanges) {
      setOnCancel(() => () => {
        setFormData(originalFormData || {});
        setShowActionButtons(false);
      });

      setOnSubmit(() => handleSubmit);
    } else {
      setOnCancel(null);
      setOnSubmit(null);
    }
  }, [
    formData,
    originalFormData,
    loading,
    setShowActionButtons,
    setOnCancel,
    setOnSubmit,
  ]);

  const handleSubmit = async () => {
    // Safety check - don't submit if formData is not loaded
    if (!formData || !originalFormData || loading) {
      console.warn("Cannot submit: formData not loaded or still loading");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      // Refresh data
      const result = await response.json();
      setFormData(result.event);
      setOriginalFormData(result.event);
      setShowActionButtons(false);
    } catch (error) {
      console.error("Error updating event:", error);
      setError("Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  const handleNestedInputChange = (
    parent: string,
    field: string,
    value: any
  ) => {
    setFormData((prev) => {
      const parentData = prev[parent as keyof typeof prev];
      return {
        ...prev,
        [parent]: {
          ...(parentData && typeof parentData === "object" ? parentData : {}),
          [field]: value,
        },
      };
    });
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading event...</p>
      </div>
    );
  }

  // Don't render form if formData is null/undefined
  if (!formData) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading form data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Post-Event Content */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Post-Event Content
          </h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label
                htmlFor="googlePhotosAlbumUrl"
                className="block text-sm font-medium text-gray-700"
              >
                Post Event Photo Album URL
              </label>
              <input
                type="url"
                id="googlePhotosAlbumUrl"
                placeholder="https://photos.app.goo.gl/..."
                value={formData.media?.googlePhotosAlbumUrl || ""}
                onChange={(e) =>
                  handleNestedInputChange(
                    "media",
                    "googlePhotosAlbumUrl",
                    e.target.value
                  )
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="thankYouMessage"
                className="block text-sm font-medium text-gray-700"
              >
                Thank You Message
              </label>
              <textarea
                id="thankYouMessage"
                rows={3}
                placeholder="Message to show after event completion"
                value={formData.postEventContent?.thankYouMessage || ""}
                onChange={(e) =>
                  handleNestedInputChange(
                    "postEventContent",
                    "thankYouMessage",
                    e.target.value
                  )
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="sponsorThankYou"
                className="block text-sm font-medium text-gray-700"
              >
                Sponsor Thank You Message
              </label>
              <textarea
                id="sponsorThankYou"
                rows={3}
                placeholder="Special message for sponsors"
                value={formData.postEventContent?.sponsorThankYou || ""}
                onChange={(e) =>
                  handleNestedInputChange(
                    "postEventContent",
                    "sponsorThankYou",
                    e.target.value
                  )
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <SortableList
              label="Post-Event Highlights"
              placeholder="Enter a highlight..."
              items={formData.postEventContent?.eventHighlights || []}
              renderItem={(item: string, index: number) => (
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const items = [
                            ...(formData.postEventContent?.eventHighlights ||
                              []),
                          ];
                          items[index] = e.target.value;
                          handleNestedInputChange(
                            "postEventContent",
                            "eventHighlights",
                            items
                          );
                        }}
                        className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 focus:px-2 focus:py-1 focus:rounded"
                        style={{
                          width: `${Math.max(String(item).length * 8, 100)}px`,
                        }}
                      />
                      {((originalFormData?.postEventContent?.eventHighlights ||
                        [])[index] ?? "") !== item && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Modified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              onAdd={(value) =>
                handleNestedInputChange("postEventContent", "eventHighlights", [
                  ...(formData.postEventContent?.eventHighlights || []),
                  value,
                ])
              }
              onDelete={(index) =>
                handleNestedInputChange(
                  "postEventContent",
                  "eventHighlights",
                  (formData.postEventContent?.eventHighlights || []).filter(
                    (_, i) => i !== index
                  )
                )
              }
              onOrderChange={(order) => {
                const items = formData.postEventContent?.eventHighlights || [];
                const next = order.map((oldIdx) => items[oldIdx]);
                handleNestedInputChange(
                  "postEventContent",
                  "eventHighlights",
                  next
                );
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="participantCount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Participant Count
                </label>
                <input
                  type="number"
                  id="participantCount"
                  min="0"
                  value={formData.postEventContent?.participantCount || ""}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "postEventContent",
                      "participantCount",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="fundsRaised"
                  className="block text-sm font-medium text-gray-700"
                >
                  Funds Raised ($)
                </label>
                <input
                  type="number"
                  id="fundsRaised"
                  min="0"
                  step="0.01"
                  value={formData.postEventContent?.fundsRaised || ""}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "postEventContent",
                      "fundsRaised",
                      parseFloat(e.target.value) || 0
                    )
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
