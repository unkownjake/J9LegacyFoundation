"use client";

import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ExternalLink,
  Edit,
  Trash2,
  File,
} from "lucide-react";
import { EventDisplay } from "@/lib/types/events";

interface EventCardProps {
  event: EventDisplay;
  showActions?: boolean;
  noHover?: boolean;
  onView?: (event: EventDisplay) => void;
  onEdit?: (event: EventDisplay) => void;
  onDelete?: (event: EventDisplay) => void;
  onViewRegistrations?: (event: EventDisplay) => void;
}

export default function EventCard({
  event,
  showActions = true,
  noHover = false,
  onView,
  onEdit,
  onDelete,
  onViewRegistrations,
}: EventCardProps) {
  const formatEventDate = (startTime: number) => {
    return new Date(startTime).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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

  const getEventStatus = (event: EventDisplay) => {
    const now = Date.now();
    if (event.schedule.startTime > now) return "upcoming";
    if (event.schedule.endTime < now) return "past";
    return "ongoing";
  };

  const status = getEventStatus(event);
  const statusColor = {
    upcoming: "bg-green-100 text-green-800",
    ongoing: "bg-blue-100 text-blue-800",
    past: "bg-gray-100 text-gray-800",
  }[status];

  return (
    <div
      className={`p-6 border-b border-gray-200 last:border-b-0 ${
        !noHover ? "hover:bg-gray-50" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
            >
              {status}
            </span>
          </div>

          {event.shortDescription && (
            <p className="text-gray-600 mb-3">{event.shortDescription}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatEventDate(event.schedule.startTime)}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatEventTime(
                event.schedule.startTime,
                event.schedule.endTime
              )}
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {event.location.name}, {event.location.city}
            </div>
            {event.responseSummary && (
              <div className="flex items-center">
                <File className="h-4 w-4 mr-1" />
                {event.responseSummary.totalResponses} responses
              </div>
            )}
            {event.registration.maxCapacity && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {event.responseSummary?.totalParticipants || 0}/
                {event.registration.maxCapacity}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {event.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {showActions && (
          <div className="flex items-center space-x-2 ml-4">
            {onViewRegistrations && (
              <button
                onClick={() => onViewRegistrations(event)}
                className="p-2 text-gray-400 hover:text-purple-600"
                title="View Registrations"
              >
                <Users className="h-4 w-4" />
              </button>
            )}
            {onView && (
              <button
                onClick={() => onView(event)}
                className="p-2 text-gray-400 hover:text-blue-600"
                title="View Event"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(event)}
                className="p-2 text-gray-400 hover:text-blue-600"
                title="Edit Event"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(event)}
                className="p-2 text-gray-400 hover:text-red-600"
                title="Delete Event"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
