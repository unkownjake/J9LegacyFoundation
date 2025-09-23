"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft, AlertCircle, Save } from "lucide-react";
import Link from "next/link";
import { EventDisplay } from "@/lib/types/events";
import EventCard from "@/components/admin/EventCard";

// Context for sharing state between layout and child pages
interface EventDetailContextType {
  showActionButtons: boolean;
  setShowActionButtons: (show: boolean) => void;
  onCancel: (() => void) | null;
  setOnCancel: (handler: (() => void) | null) => void;
  onSubmit: (() => void) | null;
  setOnSubmit: (handler: (() => void) | null) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
}

const EventDetailContext = createContext<EventDetailContextType | null>(null);

export const useEventDetailContext = () => {
  const context = useContext(EventDetailContext);
  if (!context) {
    throw new Error(
      "useEventDetailContext must be used within EventDetailLayout"
    );
  }
  return context;
};

export default function EventDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action button state
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [onCancel, setOnCancel] = useState<(() => void) | null>(null);
  const [onSubmit, setOnSubmit] = useState<(() => void) | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch event");
        }
        const result = await response.json();
        setEvent(result.event);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || "Event not found"}
          </h3>
          <p className="text-gray-500 mb-4">
            The event you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            href="/admin/events/manage-events"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-darker"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => pathname === path;

  // Disable navigation when action buttons are shown
  const isNavigationDisabled = showActionButtons;

  const contextValue: EventDetailContextType = {
    showActionButtons,
    setShowActionButtons,
    onCancel,
    setOnCancel,
    onSubmit,
    setOnSubmit,
    saving,
    setSaving,
  };

  return (
    <EventDetailContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-50">
        {/* Header with Event Info */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Event Card - Integrated into header */}
            <div className="flex items-start space-x-4">
              <Link
                href="/admin/events/manage-events"
                className={`mt-5 p-2 rounded-md ${
                  isNavigationDisabled
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                }`}
                onClick={(e) => {
                  if (isNavigationDisabled) {
                    e.preventDefault();
                  }
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex-1">
                <EventCard event={event} showActions={false} noHover={true} />
              </div>

              {/* Action Buttons */}
              {showActionButtons && (
                <div className="flex items-center space-x-3 mt-5">
                  <button
                    type="button"
                    onClick={onCancel || (() => {})}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit || (() => {})}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <Link
                  href={`/admin/events/manage-events/${eventId}`}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive(`/admin/events/manage-events/${eventId}`)
                      ? "border-primary text-primary"
                      : isNavigationDisabled
                      ? "border-transparent text-gray-300 cursor-not-allowed"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={(e) => {
                    if (isNavigationDisabled) {
                      e.preventDefault();
                    }
                  }}
                >
                  View Responses
                </Link>
                <Link
                  href={`/admin/events/manage-events/${eventId}/content`}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive(`/admin/events/manage-events/${eventId}/content`)
                      ? "border-primary text-primary"
                      : isNavigationDisabled
                      ? "border-transparent text-gray-300 cursor-not-allowed"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={(e) => {
                    if (isNavigationDisabled) {
                      e.preventDefault();
                    }
                  }}
                >
                  Content
                </Link>
                <Link
                  href={`/admin/events/manage-events/${eventId}/response`}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive(`/admin/events/manage-events/${eventId}/response`)
                      ? "border-primary text-primary"
                      : isNavigationDisabled
                      ? "border-transparent text-gray-300 cursor-not-allowed"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={(e) => {
                    if (isNavigationDisabled) {
                      e.preventDefault();
                    }
                  }}
                >
                  Response Method
                </Link>
                <Link
                  href={`/admin/events/manage-events/${eventId}/post-event`}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive(
                      `/admin/events/manage-events/${eventId}/post-event`
                    )
                      ? "border-primary text-primary"
                      : isNavigationDisabled
                      ? "border-transparent text-gray-300 cursor-not-allowed"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={(e) => {
                    if (isNavigationDisabled) {
                      e.preventDefault();
                    }
                  }}
                >
                  Post-Event
                </Link>
                <Link
                  href={`/admin/events/manage-events/${eventId}/advanced`}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive(`/admin/events/manage-events/${eventId}/advanced`)
                      ? "border-primary text-primary"
                      : isNavigationDisabled
                      ? "border-transparent text-gray-300 cursor-not-allowed"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={(e) => {
                    if (isNavigationDisabled) {
                      e.preventDefault();
                    }
                  }}
                >
                  Advanced
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </EventDetailContext.Provider>
  );
}
