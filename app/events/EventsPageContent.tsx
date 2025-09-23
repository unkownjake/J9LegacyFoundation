"use client";

import { useState, useEffect } from "react";
import { EventDisplay, isEventOngoing } from "@/lib/types/events";
import { Calendar, MapPin, Clock, Users, Star } from "lucide-react";
import Link from "next/link";
import type { EventsPageContent, EventsPageData } from "@/lib/types/eventsPage";

interface EventsPageProps {
  eventsPageContent: EventsPageContent;
  eventsData: EventsPageData;
}

export default function EventsPageContent({
  eventsPageContent,
  eventsData,
}: EventsPageProps) {
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

  const renderEventCard = (
    event: EventDisplay,
    showCapacity: boolean = true
  ) => {
    const isOngoing = isEventOngoing(event.schedule);

    return (
      <div
        key={event.id}
        className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
          isOngoing
            ? "bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300"
            : "bg-white"
        }`}
      >
        <div className="h-48 bg-gray-200">
          {event.media?.imageUrl ? (
            <>
              {console.log(
                `Rendering image for event ${event.id}:`,
                event.media.imageUrl
              )}
              <img
                src={event.media.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
                onLoad={() => console.log(`Image loaded for event ${event.id}`)}
                onError={(e) => {
                  console.log(
                    `Image failed to load for event ${event.id}:`,
                    event.media.imageUrl
                  );
                  // Hide image if it fails to load
                  e.currentTarget.style.display = "none";
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Calendar className="h-12 w-12" />
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <Link
                href={`/events/${event.slug}`}
                className="hover:text-primary transition-colors"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">
                  {event.title}
                </h3>
              </Link>
              {isOngoing && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Happening Now
                </div>
              )}
            </div>
          </div>

          {event.shortDescription && (
            <p className="text-gray-600 mb-4">{event.shortDescription}</p>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formatEventDate(event.schedule.startTime)}</span>
            </div>

            <div className="flex items-center text-gray-500">
              <Clock className="h-4 w-4 mr-2" />
              <span>
                {formatEventTime(
                  event.schedule.startTime,
                  event.schedule.endTime
                )}
              </span>
            </div>

            <div className="flex items-center text-gray-500">
              <MapPin className="h-4 w-4 mr-2" />
              <span>
                {event.location.name}, {event.location.city},{" "}
                {event.location.state}
              </span>
            </div>

            {showCapacity && event.registration.maxCapacity && (
              <div className="flex items-center text-gray-500">
                <Users className="h-4 w-4 mr-2" />
                <span>
                  {event.responseSummary?.totalParticipants || 0} of{" "}
                  {event.registration.maxCapacity} spots filled
                </span>
              </div>
            )}
          </div>

          {event.registration.cost !== undefined && (
            <div className="mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {event.registration.cost === 0
                  ? "Free"
                  : `$${event.registration.cost}`}
              </span>
            </div>
          )}

          {/* Post-Event Content for Past Events */}
          {!showCapacity && event.postEventContent && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              {event.postEventContent.thankYouMessage && (
                <p className="text-green-800 font-medium mb-2">
                  {event.postEventContent.thankYouMessage}
                </p>
              )}

              {event.postEventContent.sponsorThankYou && (
                <p className="text-green-700 text-sm mb-2">
                  {event.postEventContent.sponsorThankYou}
                </p>
              )}

              {event.postEventContent.participantCount && (
                <p className="text-green-700 text-sm mb-2">
                  <strong>Participants:</strong>{" "}
                  {event.postEventContent.participantCount}
                </p>
              )}

              {event.postEventContent.fundsRaised && (
                <p className="text-green-700 text-sm mb-2">
                  <strong>Funds Raised:</strong> $
                  {event.postEventContent.fundsRaised}
                </p>
              )}

              {event.postEventContent.eventHighlights &&
                event.postEventContent.eventHighlights.length > 0 && (
                  <div className="mb-2">
                    <p className="text-green-700 text-sm font-medium mb-1">
                      Event Highlights:
                    </p>
                    <ul className="text-green-700 text-sm space-y-1">
                      {event.postEventContent.eventHighlights.map(
                        (highlight, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-600 mr-2">•</span>
                            {highlight}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>

          <Link
            href={`/events/${event.slug}`}
            className="block w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-darker transition-colors text-center font-semibold"
          >
            {event.registration.type === "dropin"
              ? "Learn More"
              : "View Details"}
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-secondary">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="flex flex-col mb-8">
          <div className="flex items-center mb-8">
            <Calendar className="text-primary mr-4 h-12 w-12" />
            <h1 className="text-primary text-4xl font-bold">
              {eventsPageContent.title}
            </h1>
          </div>
          <p className="text-xl text-accent">{eventsPageContent.subtitle}</p>
        </div>

        {/* Upcoming Events Section */}
        {eventsPageContent.showUpcomingSection &&
          eventsData?.upcomingEvents &&
          eventsData.upcomingEvents.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {eventsPageContent.upcomingSectionTitle}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventsData.upcomingEvents.map((event) =>
                  renderEventCard(event, true)
                )}
              </div>
            </section>
          )}

        {/* Past Events Section */}
        {eventsPageContent.showPastSection &&
          eventsData?.pastEvents &&
          eventsData.pastEvents.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {eventsPageContent.pastSectionTitle}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventsData.pastEvents.map((event) =>
                  renderEventCard(event, false)
                )}
              </div>
            </section>
          )}

        {/* No Events Message */}
        {(!eventsData ||
          (eventsData.upcomingEvents.length === 0 &&
            eventsData.pastEvents.length === 0)) && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {eventsPageContent.noEventsMessage}
            </h3>
            <p className="text-gray-500">
              {eventsPageContent.noEventsSubtitle}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
