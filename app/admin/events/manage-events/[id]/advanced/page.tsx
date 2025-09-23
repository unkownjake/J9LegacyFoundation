"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Trash2 } from "lucide-react";
import { EventPayload } from "@/lib/types/events";
import { useEventDetailContext } from "../layout";

export default function AdvancedPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { setShowActionButtons, setOnCancel, setOnSubmit, setSaving } =
    useEventDetailContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EventPayload>>({});
  const [originalFormData, setOriginalFormData] =
    useState<Partial<EventPayload> | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDeleteEvent = async () => {
    if (deleteConfirmation !== formData?.title) {
      setError(
        "Event name does not match. Please type the exact event name to confirm deletion."
      );
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      // Redirect to events list
      router.push("/admin/events/manage-events");
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete event");
    } finally {
      setDeleting(false);
    }
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
        {/* Advanced Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Advanced Settings
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3">
                Search Engine Optimization
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="metaDescription"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    rows={3}
                    placeholder="Brief description for search engines (150-160 characters)"
                    value={formData?.metaDescription || ""}
                    onChange={(e) =>
                      handleInputChange("metaDescription", e.target.value)
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData?.metaDescription?.length || 0}/160 characters
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-400">
          <h2 className="text-lg font-medium text-red-800 mb-4">Danger Zone</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium text-red-700 mb-2">
                Delete Event
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Once you delete an event, there is no going back. This will
                permanently remove the event and all associated data including
                registrations and responses.
              </p>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2 text-center">
                Delete Event
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 text-center mb-4">
                  This action cannot be undone. This will permanently delete the
                  event and all associated data.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type the event name to confirm deletion:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={formData?.title || "Event name"}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Expected: "{formData?.title}"
                  </p>
                </div>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteConfirmation("");
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEvent}
                  disabled={deleting || deleteConfirmation !== formData?.title}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting..." : "Delete Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
