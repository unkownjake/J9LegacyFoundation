"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { EventResponse, EventDisplay } from "@/lib/types/events";
import { UserCheck, Eye, Plus, Edit, Trash2, X } from "lucide-react";
import RegistrationForm from "@/components/events/RegistrationForm";
import ExportResponsesButton from "@/components/admin/ExportResponsesButton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export default function ViewResponsesPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [responses, setResponses] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventDisplay | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResponse, setEditingResponse] = useState<EventResponse | null>(
    null
  );
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmVerification, setConfirmVerification] = useState<{
    responseId: string;
    nextChecked: boolean;
  } | null>(null);

  // Convert any value to a lowercase string for searching
  const valueToString = (val: unknown): string => {
    if (val == null) return "";
    if (Array.isArray(val))
      return val.map(valueToString).join(" ").toLowerCase();
    if (val instanceof Date) return val.toISOString().toLowerCase();
    if (typeof val === "object")
      return Object.values(val as Record<string, unknown>)
        .map(valueToString)
        .join(" ")
        .toLowerCase();
    return String(val).toLowerCase();
  };

  const filteredResponses = searchQuery
    ? responses.filter((r) => {
        const q = searchQuery.toLowerCase();
        // Top-level email and human-friendly time (avoid matching raw epoch)
        const haystackParts: string[] = [];
        haystackParts.push(valueToString(r.email));
        const dt = new Date(r.time);
        haystackParts.push(dt.toLocaleString().toLowerCase());
        haystackParts.push(dt.toLocaleDateString().toLowerCase());
        haystackParts.push(dt.toLocaleTimeString().toLowerCase());
        // Fields
        if (r.fields) {
          haystackParts.push(
            Object.values(r.fields).map(valueToString).join(" ")
          );
        }
        // Participants
        if (Array.isArray(r.participants)) {
          haystackParts.push(
            r.participants.map((p) => valueToString(p)).join(" ")
          );
        }
        // Metadata (optional)
        if ((r as any).metadata) {
          haystackParts.push(valueToString((r as any).metadata));
        }

        const haystack = haystackParts.join(" ");
        return haystack.includes(q);
      })
    : responses;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch event data
        const eventResponse = await fetch(`/api/events/${eventId}`);
        if (!eventResponse.ok) {
          throw new Error("Failed to fetch event");
        }
        const eventResult = await eventResponse.json();
        setEvent(eventResult.event);

        // Fetch responses
        const responsesResponse = await fetch(
          `/api/events/${eventId}/responses`
        );
        if (!responsesResponse.ok) {
          throw new Error("Failed to fetch responses");
        }
        const responsesResult = await responsesResponse.json();
        setResponses(responsesResult.responses || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const handleFormSubmit = async (responseData: Partial<EventResponse>) => {
    setSaving(true);
    try {
      if (formMode === "add") {
        const response = await fetch(`/api/events/${eventId}/responses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(responseData),
        });

        if (!response.ok) {
          throw new Error("Failed to add response");
        }

        const result = await response.json();
        setResponses([...responses, result.response]);
        setShowAddForm(false);
      } else if (formMode === "edit" && editingResponse) {
        const response = await fetch(
          `/api/events/${eventId}/responses/${editingResponse.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(responseData),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update response");
        }

        const result = await response.json();
        setResponses(
          responses.map((r) =>
            r.id === editingResponse.id ? result.response : r
          )
        );
        setEditingResponse(null);
        setShowEditDialog(false);
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      setError("Failed to submit response");
    } finally {
      setSaving(false);
    }
  };

  const handleFormCancel = () => {
    if (formMode === "add") {
      setShowAddForm(false);
    } else if (formMode === "edit") {
      setEditingResponse(null);
      setShowEditDialog(false);
    }
    setFormMode(null);
  };

  const handleDeleteResponse = async (responseId: string) => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/events/${eventId}/responses/${responseId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete response");
      }

      setResponses(responses.filter((r) => r.id !== responseId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting response:", error);
      setError("Failed to delete response");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading responses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-medium text-gray-900 whitespace-nowrap">
          Event Responses ({filteredResponses.length}
          {searchQuery ? ` / ${responses.length}` : ""})
        </h2>
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search responses (email, fields, participants, metadata)"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center space-x-2">
          {responses.length > 0 && (
            <ExportResponsesButton event={event} responses={responses} />
          )}
          {event?.registration?.type !== "dropin" && (
            <button
              onClick={() => {
                setShowAddForm(true);
                setFormMode("add");
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-darker whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Response
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form Dialog */}
      {((showAddForm && formMode === "add") ||
        (showEditDialog && formMode === "edit")) &&
        event && (
          <RegistrationForm
            event={event}
            initialData={
              formMode === "edit" ? editingResponse || undefined : undefined
            }
            onSave={handleFormSubmit}
            onCancel={handleFormCancel}
            saving={saving}
            isAdmin={true}
            showDialog={true}
            dialogTitle={formMode === "add" ? "Add Response" : "Edit Response"}
          />
        )}

      {/* Responses List */}
      {event?.registration?.type === "dropin" ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop-in Event
          </h3>
          <p className="text-gray-500">
            This is a drop-in event. No registration or responses are required.
            People can attend without signing up in advance.
          </p>
        </div>
      ) : responses.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No responses yet
          </h3>
          <p className="text-gray-500">
            Responses will appear here once people start signing up for this
            event.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredResponses.map((response) => (
              <div key={response.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {String(
                          response.email ||
                            response.fields?.name ||
                            `Response ${response.id.slice(0, 8)}`
                        )}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {response.participants.length} participant
                        {response.participants.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500 mb-2">
                      Submitted: {new Date(response.time).toLocaleString()}
                    </div>

                    <div className="text-sm text-gray-600">
                      {Object.entries(response.fields).map(([key, value]) => (
                        <div key={key}>
                          {key}: {String(value)}
                        </div>
                      ))}

                      {/* Show participant details */}
                      {response.participants.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            Participants:
                          </div>
                          {response.participants.map((participant, index) => (
                            <div
                              key={index}
                              className="text-xs text-gray-600 ml-2"
                            >
                              Participant {index + 1}:{" "}
                              {Object.entries(participant)
                                .map(
                                  ([key, value]) => `${key}: ${String(value)}`
                                )
                                .join(", ") || "No details"}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Payment verification for registration events */}
                      {response.type === "registration" &&
                        event?.registration?.cost && (
                          <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                            {/* Payment Status */}
                            <div className="text-xs text-gray-500 mb-2">
                              <div className="font-medium text-gray-600 mb-1">
                                Payment Status:
                              </div>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  response.metadata?.paymentStatus === "confirm"
                                    ? "bg-green-100 text-green-800"
                                    : response.metadata?.paymentStatus ===
                                      "later"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {response.metadata?.paymentStatus === "confirm"
                                  ? "Confirmed"
                                  : response.metadata?.paymentStatus === "later"
                                  ? "Pay Later"
                                  : "Not Specified"}
                              </span>
                            </div>

                            {/* Payment link tracking */}
                            {response.metadata?.paymentLinksClicked && (
                              <div className="text-xs text-gray-500">
                                <div className="font-medium text-gray-600 mb-1">
                                  Payment Links Clicked:
                                </div>
                                <div className="flex space-x-4">
                                  {response.metadata.paymentLinksClicked
                                    .venmo && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Venmo
                                    </span>
                                  )}
                                  {response.metadata.paymentLinksClicked
                                    .paypal && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      PayPal
                                    </span>
                                  )}
                                  {!response.metadata.paymentLinksClicked
                                    .venmo &&
                                    !response.metadata.paymentLinksClicked
                                      .paypal && (
                                      <span className="text-gray-400">
                                        No payment links clicked
                                      </span>
                                    )}
                                </div>
                              </div>
                            )}

                            {/* Payment verification checkbox */}
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={response.registrationVerified || false}
                                onChange={async (e) => {
                                  const nextChecked = e.target.checked;
                                  setConfirmVerification({
                                    responseId: response.id,
                                    nextChecked,
                                  });
                                }}
                                className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                Payment Verified
                              </span>
                            </label>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingResponse(response);
                        setShowEditDialog(true);
                        setFormMode("edit");
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="Edit Response"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(response.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete Response"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                Delete Response
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this response? This action
                  cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteResponse(deleteConfirm)}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Confirmation Dialog */}
      <AlertDialog open={!!confirmVerification}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm payment verification change
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmVerification?.nextChecked
                ? "Mark this response as payment verified?"
                : "Unmark this response as payment verified?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmVerification(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmVerification) return;
                const { responseId, nextChecked } = confirmVerification;
                setConfirmVerification(null);
                // Optimistic update
                setResponses((prev) =>
                  prev.map((r) =>
                    r.id === responseId
                      ? { ...r, registrationVerified: nextChecked }
                      : r
                  )
                );
                try {
                  const response_update = await fetch(
                    `/api/events/${eventId}/responses/${responseId}`,
                    {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        registrationVerified: nextChecked,
                      }),
                    }
                  );
                  if (!response_update.ok) throw new Error("Failed to update");
                  const result = await response_update.json();
                  setResponses((prev) =>
                    prev.map((r) => (r.id === responseId ? result.response : r))
                  );
                } catch (error) {
                  console.error("Error updating verification:", error);
                  setResponses((prev) =>
                    prev.map((r) =>
                      r.id === responseId
                        ? { ...r, registrationVerified: !nextChecked }
                        : r
                    )
                  );
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
