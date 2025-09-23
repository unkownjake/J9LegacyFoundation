"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { EventPayload, RegistrationFormSchema } from "@/lib/types/events";
import DateTimeInput from "@/components/ui/DateTimeInput";
import RegistrationFormBuilder from "@/components/admin/RegistrationFormBuilder";
import { useEventDetailContext } from "../layout";

export default function ResponseMethodPage() {
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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const handleFormSchemaChange = (schema: RegistrationFormSchema) => {
    handleNestedInputChange("registration", "formSchema", schema);
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
        {/* Registration Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Registration Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="registrationType"
                className="block text-sm font-medium text-gray-700"
              >
                Registration Type *
              </label>
              <select
                id="registrationType"
                required
                value={formData.registration?.type || "dropin"}
                onChange={(e) => {
                  const newType = e.target.value;
                  // Clear fields that shouldn't be set for certain types
                  if (newType === "dropin") {
                    handleNestedInputChange("registration", "type", newType);
                    // Clear cost, deadline, and formSchema for dropin
                    handleNestedInputChange("registration", "cost", undefined);
                    handleNestedInputChange(
                      "registration",
                      "deadline",
                      undefined
                    );
                    handleNestedInputChange(
                      "registration",
                      "formSchema",
                      undefined
                    );
                  } else if (newType === "rsvp") {
                    handleNestedInputChange("registration", "type", newType);
                    // Clear cost for rsvp (rsvp events are free)
                    handleNestedInputChange("registration", "cost", undefined);
                  } else {
                    handleNestedInputChange("registration", "type", newType);
                  }
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="dropin">
                  Drop-in (No registration required)
                </option>
                <option value="rsvp">RSVP Required</option>
                <option value="required">Registration Required</option>
              </select>
            </div>

            {/* Max Capacity - shown for all types */}
            <div>
              <label
                htmlFor="maxCapacity"
                className="block text-sm font-medium text-gray-700"
              >
                Maximum Capacity
              </label>
              <input
                type="number"
                id="maxCapacity"
                min="0"
                value={formData.registration?.maxCapacity || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    // Set to undefined when empty
                    handleNestedInputChange(
                      "registration",
                      "maxCapacity",
                      undefined
                    );
                  } else {
                    handleNestedInputChange(
                      "registration",
                      "maxCapacity",
                      parseInt(value) || 0
                    );
                  }
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>

            {/* Registration Deadline and Cost - shown for rsvp/required */}
            {(formData.registration?.type === "rsvp" ||
              formData.registration?.type === "required") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="registrationDeadline"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {formData.registration?.type === "rsvp"
                      ? "RSVP Deadline"
                      : "Registration Deadline"}
                  </label>
                  <DateTimeInput
                    id="registrationDeadline"
                    valueMs={formData.registration?.deadline}
                    onChangeMs={(ms) =>
                      handleNestedInputChange("registration", "deadline", ms)
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                {/* Cost - only shown for required events */}
                {formData.registration?.type === "required" && (
                  <div>
                    <label
                      htmlFor="cost"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Cost ($)
                    </label>
                    <input
                      type="number"
                      id="cost"
                      min="0"
                      step="0.01"
                      value={formData.registration?.cost || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "registration",
                          "cost",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Registration Form Builder */}
        {(formData.registration?.type === "rsvp" ||
          formData.registration?.type === "required") && (
          <div className="bg-white shadow rounded-lg p-6">
            <RegistrationFormBuilder
              formSchema={
                formData.registration?.formSchema || {
                  fields: {},
                }
              }
              onChange={handleFormSchemaChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
