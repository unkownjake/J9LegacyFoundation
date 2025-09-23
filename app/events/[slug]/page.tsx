"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
} from "lucide-react";
import { getEventBySlug, getAllEventSlugs } from "./account";
import { EventDisplay, EventResponse } from "@/lib/types/events";
import { isEventOngoing, isEventPast, isEventFuture } from "@/lib/types/events";
import RegistrationForm from "@/components/events/RegistrationForm";

export default function EventPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventDisplay | null>(null);
  const [allEvents, setAllEvents] = useState<
    { slug: string; title: string; schedule: { startTime: number } }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventData, allEventsData] = await Promise.all([
          getEventBySlug(slug),
          getAllEventSlugs(),
        ]);

        setEvent(eventData);
        setAllEvents(allEventsData);

        // Find current event index for navigation
        const index = allEventsData.findIndex((e) => e.slug === slug);
        setCurrentEventIndex(index);
      } catch (error) {
        console.error("Failed to fetch event data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-secondary min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading event...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-secondary min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Event Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-darker transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatEventTime = (startTime: number, endTime: number) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const startTimeStr = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const endTimeStr = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${startTimeStr} - ${endTimeStr}`;
  };

  const formatEventDate = (startTime: number) => {
    return new Date(startTime).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getEventStatus = () => {
    if (isEventPast(event.schedule)) return "Past Event";
    if (isEventOngoing(event.schedule)) return "Happening Now";
    if (isEventFuture(event.schedule)) return "Upcoming Event";
    return "Event";
  };

  const getStatusColor = () => {
    if (isEventPast(event.schedule)) return "bg-gray-100 text-gray-800";
    if (isEventOngoing(event.schedule)) return "bg-green-100 text-green-800";
    if (isEventFuture(event.schedule)) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const canRegister =
    (event.registration.type === "required" &&
      event.registration.cost !== undefined) ||
    event.registration.type === "rsvp";
  const isPast = isEventPast(event.schedule);
  const isOngoing = isEventOngoing(event.schedule);

  const handleRegistrationSubmit = async (
    responseData: Partial<EventResponse>
  ) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/events/${event.id}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(responseData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit registration");
      }

      // Send email notification for paid registrations
      if (event.registration.type === "required" && event.registration.cost) {
        const participantCount = responseData.participants?.length || 1;
        const totalCost = participantCount * (event.registration.cost || 0);

        try {
          await fetch("/api/notifications/registration", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event,
              response: responseData,
              participantCount,
              totalCost,
            }),
          });
        } catch (emailError) {
          console.error("Error sending notification email:", emailError);
          // Don't fail the registration if email fails
        }
      }

      setRegistrationSuccess(true);
      setShowRegistrationForm(false);

      // Refresh the page to update capacity numbers
      setTimeout(() => {
        window.location.reload();
      }, 2000); // Wait 2 seconds to show success message first
    } catch (error) {
      console.error("Error submitting registration:", error);
      alert("Failed to submit registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-secondary min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Navigation Header */}
        <div className="mb-8">
          <Link
            href="/events"
            className="inline-flex items-center text-primary hover:text-primary-darker transition-colors mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>

          {/* Event Navigation */}
          {allEvents.length > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {currentEventIndex > 0 && (
                  <Link
                    href={`/events/${allEvents[currentEventIndex - 1].slug}`}
                    className="inline-flex items-center text-primary hover:text-primary-darker transition-colors"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {allEvents[currentEventIndex - 1].title}
                  </Link>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {currentEventIndex < allEvents.length - 1 && (
                  <Link
                    href={`/events/${allEvents[currentEventIndex + 1].slug}`}
                    className="inline-flex items-center text-primary hover:text-primary-darker transition-colors"
                  >
                    {allEvents[currentEventIndex + 1].title}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex gap-8">
            {/* Left Content */}
            <div className="flex-1">
              {/* Status and Title */}
              <div className="flex items-center mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}
                >
                  {getEventStatus()}
                </span>
                {event.isFeatured && (
                  <Star className="h-5 w-5 text-yellow-500 ml-3" />
                )}
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {event.title}
              </h1>

              {event.shortDescription && (
                <p className="text-xl text-gray-600 mb-6">
                  {event.shortDescription}
                </p>
              )}

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-3 text-primary" />
                    <span className="font-medium">
                      {formatEventDate(event.schedule.startTime)}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-3 text-primary" />
                    <span className="font-medium">
                      {formatEventTime(
                        event.schedule.startTime,
                        event.schedule.endTime
                      )}
                    </span>
                  </div>

                  <div className="flex items-start text-gray-600">
                    <MapPin className="h-5 w-5 mr-3 text-primary mt-1" />
                    <div>
                      <span className="font-medium">{event.location.name}</span>
                      <br />
                      <span>
                        {event.location.address &&
                          `${event.location.address}, `}
                        {event.location.city}, {event.location.state}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {event.registration.maxCapacity && (
                    <div className="flex items-center text-gray-600">
                      <Users className="h-5 w-5 mr-3 text-primary" />
                      <span className="font-medium">
                        {event.registration.type === "dropin"
                          ? `Max Capacity: ${event.registration.maxCapacity}`
                          : `${
                              event.responseSummary?.totalParticipants || 0
                            } of ${
                              event.registration.maxCapacity
                            } spots filled`}
                      </span>
                    </div>
                  )}

                  {event.registration.type === "dropin" ? (
                    <div className="text-gray-600">
                      <span className="font-medium">Event Type: </span>
                      <span className="text-lg font-semibold text-primary">
                        Drop-in Event
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        No registration or RSVP required - just show up!
                      </div>
                    </div>
                  ) : event.registration.type === "rsvp" ? (
                    <div className="text-gray-600">
                      <span className="font-medium">Cost: </span>
                      <span className="text-lg font-semibold text-primary">
                        Free
                      </span>
                    </div>
                  ) : event.registration.cost !== undefined ? (
                    <div className="text-gray-600">
                      <span className="font-medium">Cost: </span>
                      <span className="text-lg font-semibold text-primary">
                        {event.registration.cost === 0
                          ? "Free"
                          : `$${event.registration.cost}`}
                      </span>
                    </div>
                  ) : null}

                  {event.registration.deadline && (
                    <div className="text-gray-600">
                      <span className="font-medium">
                        {event.registration.type === "rsvp"
                          ? "RSVP Deadline: "
                          : "Registration Deadline: "}
                      </span>
                      <span>
                        {new Date(
                          event.registration.deadline
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right Image */}
            {event.media.imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={event.media.imageUrl}
                  alt={event.title}
                  className="h-80 w-80 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Event Content */}
        {!isPast ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}

              <div
                className={`space-y-8 ${
                  isPast ? "lg:col-span-3" : "lg:col-span-2"
                }`}
              >
                {/* Description */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    About This Event
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Event Highlights */}
                {event.content?.highlights &&
                  event.content.highlights.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Event Highlights
                      </h2>
                      <ul className="space-y-2">
                        {event.content.highlights.map((highlight, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-primary mr-3 mt-1">•</span>
                            <span className="text-gray-700">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* What to Bring */}
                {event.content?.whatToBring &&
                  event.content.whatToBring.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        What to Bring
                      </h2>
                      <ul className="space-y-2">
                        {event.content.whatToBring.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-primary mr-3 mt-1">•</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
              {/* Sidebar - Only show for non-past events */}
              <div className="space-y-6">
                {/* Registration Card */}
                {!isPast && event.registration.type !== "dropin" && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Registration
                    </h3>

                    {canRegister ? (
                      <div className="space-y-4">
                        {event.registration.maxCapacity && (
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {Math.max(
                                0,
                                event.registration.maxCapacity -
                                  (event.responseSummary?.totalParticipants ||
                                    0)
                              )}
                            </div>
                            <div className="text-blue-800">spots remaining</div>
                          </div>
                        )}

                        <button
                          onClick={() => setShowRegistrationForm(true)}
                          className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-darker transition-colors font-semibold"
                        >
                          {event.registration.type === "required"
                            ? "Register Now"
                            : "RSVP"}
                        </button>

                        {event.registration.type === "required" &&
                          event.registration.formSchema && (
                            <p className="text-sm text-gray-600 text-center">
                              Registration form will open in a new window
                            </p>
                          )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-600 mb-4">
                          No registration required
                        </p>
                        <p className="text-sm text-gray-500">
                          Just show up and join the fun!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Event Details */}
                {(event.content?.ageRange || event.content?.skillLevel) && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Event Details
                    </h3>

                    <div className="space-y-3">
                      {event.content?.ageRange && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Age Range:
                          </span>
                          <span className="text-gray-600 ml-2">
                            {event.content.ageRange}
                          </span>
                        </div>
                      )}

                      {event.content?.skillLevel && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Skill Level:
                          </span>
                          <span className="text-gray-600 ml-2">
                            {event.content.skillLevel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Contact
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">
                        Organizer:
                      </span>
                      <span className="text-gray-600 ml-2">
                        {event.contact.organizerName}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <a
                        href={`mailto:${event.contact.organizerEmail}`}
                        className="text-primary hover:text-primary-darker ml-2"
                      >
                        {event.contact.organizerEmail}
                      </a>
                    </div>

                    {event.contact.organizerPhone && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Phone:
                        </span>
                        <a
                          href={`tel:${event.contact.organizerPhone}`}
                          className="text-primary hover:text-primary-darker ml-2"
                        >
                          {event.contact.organizerPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resources */}
                {((event.media.resources && event.media.resources.length > 0) ||
                  event.media.videoUrl) && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Resources
                    </h3>

                    <div className="space-y-4">
                      {event.media.resources &&
                        event.media.resources.length > 0 && (
                          <div>
                            <ul className="space-y-2">
                              {event.media.resources.map((resource) => (
                                <li key={resource.id}>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(
                                          `/api/storage/url?path=${encodeURIComponent(
                                            resource.path
                                          )}`
                                        );
                                        if (response.ok) {
                                          const result = await response.json();
                                          window.open(
                                            result.url,
                                            "_blank",
                                            "noopener,noreferrer"
                                          );
                                        }
                                      } catch (error) {
                                        console.error(
                                          "Error downloading resource:",
                                          error
                                        );
                                      }
                                    }}
                                    className="text-primary hover:text-primary-darker transition-colors underline"
                                  >
                                    {resource.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {event.media.videoUrl && (
                        <div>
                          <a
                            href={event.media.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-darker transition-colors"
                          >
                            Promo Video
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : isPast && event.postEventContent ? (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-green-800 mb-6 text-center">
                Event Recap
              </h2>

              <div className="flex flex-col">
                {event.postEventContent.thankYouMessage && (
                  <p className="text-green-800 font-medium mb-4">
                    {event.postEventContent.thankYouMessage}
                  </p>
                )}

                {event.postEventContent.sponsorThankYou && (
                  <p className="text-green-700 mb-4">
                    {event.postEventContent.sponsorThankYou}
                  </p>
                )}
              </div>

              {event.postEventContent.eventHighlights &&
                event.postEventContent.eventHighlights.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-green-800 mb-4 text-center">
                      Event Highlights
                    </h3>
                    <div className="flex flex-row gap-4 mb-4">
                      {event.postEventContent.participantCount && (
                        <div className="text-center p-4 bg-white rounded-lg flex-1">
                          <div className="text-3xl font-bold text-green-600">
                            {event.postEventContent.participantCount}
                          </div>
                          <div className="text-green-800 font-medium">
                            Participants
                          </div>
                        </div>
                      )}

                      {event.postEventContent.fundsRaised && (
                        <div className="text-center p-4 bg-white rounded-lg flex-1">
                          <div className="text-3xl font-bold text-green-600">
                            ${event.postEventContent.fundsRaised}
                          </div>
                          <div className="text-green-800 font-medium">
                            Funds Raised
                          </div>
                        </div>
                      )}
                    </div>
                    <ul className="flex flex-col items-start bg-white p-4 rounded-lg space-y-1">
                      {event.postEventContent.eventHighlights.map(
                        (highlight, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-600 mr-2">•</span>
                            <span className="text-green-700">{highlight}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        ) : null}

        {/* Registration Form Dialog */}
        <RegistrationForm
          event={event}
          onSave={handleRegistrationSubmit}
          onCancel={() => {
            console.log("ON CANCEL");
            setShowRegistrationForm(false);
          }}
          saving={submitting}
          isAdmin={false}
          showDialog={showRegistrationForm}
          dialogTitle={event.registration.type === "rsvp" ? "RSVP" : "Register"}
        />

        {/* Registration Success Message */}
        {registrationSuccess && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">
                  {event.registration.type === "rsvp"
                    ? "RSVP Successful!"
                    : "Registration Successful!"}
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Thank you for{" "}
                    {event.registration.type === "rsvp"
                      ? "RSVPing"
                      : "registering"}
                    ! You'll receive a confirmation email shortly.
                  </p>
                </div>
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setRegistrationSuccess(false)}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-darker"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
