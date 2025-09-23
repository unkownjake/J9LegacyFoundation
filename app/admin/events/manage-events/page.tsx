"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Eye,
  Calendar,
  ArrowLeft,
  AlertCircle,
  Search,
  Filter,
  UserCheck,
  Settings,
  ExternalLink,
  X,
} from "lucide-react";
import Link from "next/link";
import { EventDisplay, EventResponse } from "@/lib/types/events";
import EventCard from "@/components/admin/EventCard";
import DateTimeInput from "@/components/ui/DateTimeInput";

export default function EventsManagementPage() {
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "past">(
    "all"
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const result = await response.json();
        setEvents(result.events || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      setEvents(events.filter((event) => event.id !== eventId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete event");
    }
  };

  const handleCreateEvent = async (eventData: Partial<EventDisplay>) => {
    setCreating(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      const result = await response.json();
      setEvents([...events, result.event]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating event:", error);
      setError("Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  const getEventStatus = (event: EventDisplay) => {
    const now = Date.now();
    if (event.schedule.startTime > now) return "upcoming";
    if (event.schedule.endTime < now) return "past";
    return "ongoing";
  };

  const formatEventDate = (startTime: number) => {
    return new Date(startTime).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.name.toLowerCase().includes(searchTerm.toLowerCase());

    const status = getEventStatus(event);

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "upcoming")
      return matchesSearch && status === "upcoming";
    if (filterStatus === "past") return matchesSearch && status === "past";

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
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
                Events Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
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
        {/* Search and Filter */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "No events found"
                  : "No events yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first event."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-darker"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onView={(event) =>
                    window.open(`/events/${event.slug}`, "_blank")
                  }
                  onEdit={(event) =>
                    (window.location.href = `/admin/events/manage-events/${event.id}`)
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Create Event Dialog */}
        {showCreateDialog && (
          <CreateEventDialog
            onSave={handleCreateEvent}
            onCancel={() => setShowCreateDialog(false)}
            creating={creating}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <AlertCircle className="mx-auto flex items-center justify-center h-12 w-12 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900 mt-2">
                  Delete Event
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this event? This action
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
                    onClick={() => handleDeleteEvent(deleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
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

// Create Event Dialog Component
function CreateEventDialog({
  onSave,
  onCancel,
  creating,
}: {
  onSave: (data: Partial<EventDisplay>) => void;
  onCancel: () => void;
  creating: boolean;
}) {
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    location: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
    schedule: {
      startTime: 0,
      endTime: 0,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = {
      ...formData,
      schedule: {
        startTime: formData.schedule.startTime,
        endTime: formData.schedule.endTime,
      },
      tags: [],
      registration: {
        type: "dropin" as const,
        maxCapacity: undefined,
        currentCapacity: 0,
      },
    };

    onSave(eventData);
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
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as any),
        [field]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Create New Event
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">
              Basic Information
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) =>
                  handleInputChange("shortDescription", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Brief description (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Detailed event description"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Location</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location.name}
                  onChange={(e) =>
                    handleNestedInputChange("location", "name", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Venue name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "location",
                      "address",
                      e.target.value
                    )
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Street address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location.city}
                  onChange={(e) =>
                    handleNestedInputChange("location", "city", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.location.state}
                  onChange={(e) =>
                    handleNestedInputChange("location", "state", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.location.zipCode}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "location",
                      "zipCode",
                      e.target.value
                    )
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="ZIP"
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Schedule</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time *
                </label>
                <DateTimeInput
                  id="startTime"
                  valueMs={formData.schedule.startTime || undefined}
                  onChangeMs={(ms) =>
                    handleNestedInputChange("schedule", "startTime", ms)
                  }
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time *
                </label>
                <DateTimeInput
                  id="endTime"
                  valueMs={formData.schedule.endTime || undefined}
                  onChangeMs={(ms) =>
                    handleNestedInputChange("schedule", "endTime", ms)
                  }
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-darker disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
