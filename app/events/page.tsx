"use client";

import { useState, useEffect } from "react";
import { getEventsPageContent, getEventsPageData } from "./account";
import { EventsPageContent } from "@/lib/types/eventsPage";
import { EventsPageData } from "@/lib/types/eventsPage";
import { defaultEventsPageContent } from "@/lib/defaults/eventsPageDefaults";
import EventsPageContentComponent from "./EventsPageContent";

export default function EventsPage() {
  const [eventsPageContent, setEventsPageContent] =
    useState<EventsPageContent | null>(null);
  const [eventsData, setEventsData] = useState<EventsPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentData, eventsData] = await Promise.all([
          getEventsPageContent(),
          getEventsPageData(),
        ]);
        setEventsPageContent(contentData);
        setEventsData(eventsData);
      } catch (error) {
        console.error("Failed to fetch events page data:", error);
        setEventsPageContent(defaultEventsPageContent);
        setEventsData({ upcomingEvents: [], pastEvents: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-secondary min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading events...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!eventsPageContent || !eventsData) {
    return (
      <EventsPageContentComponent
        eventsPageContent={defaultEventsPageContent}
        eventsData={{ upcomingEvents: [], pastEvents: [] }}
      />
    );
  }

  return (
    <EventsPageContentComponent
      eventsPageContent={eventsPageContent}
      eventsData={eventsData}
    />
  );
}
