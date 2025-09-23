"use server";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import {
  EventDisplay,
  EventsPageData,
  isEventOngoing,
  isEventPast,
  isEventFuture,
} from "@/lib/types/events";
import { EventsPageContent } from "@/lib/types/eventsPage";
import { defaultEventsPageContent } from "@/lib/defaults/eventsPageDefaults";
import { getStorage } from "firebase-admin/storage";

export async function getEventsPageData(): Promise<EventsPageData> {
  try {
    const db = getFirebaseAdminDb();
    const storage = getStorage();

    // Fetch all active events
    const eventsSnapshot = await db
      .collection("events")
      .where("isActive", "==", true)
      .get();

    if (eventsSnapshot.empty) {
      console.log("No events found in database");
      return {
        upcomingEvents: [],
        pastEvents: [],
      };
    }

    console.log(`Found ${eventsSnapshot.size} events in database`);

    const events: EventDisplay[] = [];
    const now = Date.now();

    // Process each event
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();

      // Use the responseSummary from the event data
      const responseSummary = eventData.responseSummary || {
        totalParticipants: 0,
        totalResponses: 0,
      };

      // Process image URL if it exists (using imagePath, not imageUrl)
      let imageUrl = eventData.media?.imagePath;
      console.log(`Processing image for event ${eventDoc.id}:`, imageUrl);
      if (
        imageUrl &&
        !imageUrl.startsWith("http") &&
        !imageUrl.startsWith("blob:")
      ) {
        try {
          const bucket = storage.bucket();
          const file = bucket.file(imageUrl);
          const [url] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 1000 * 60 * 60, // 1 hour expiry
          });
          console.log(`Generated signed URL for event ${eventDoc.id}:`, url);
          imageUrl = url;
        } catch (error) {
          console.error(`Failed to get signed URL for ${imageUrl}:`, error);
          // Keep the original path if we can't get a signed URL
        }
      } else {
        console.log(`Using original URL for event ${eventDoc.id}:`, imageUrl);
      }

      // Create EventDisplay object
      const event: EventDisplay = {
        id: eventDoc.id,
        title: eventData.title,
        description: eventData.description,
        shortDescription: eventData.shortDescription,
        schedule: eventData.schedule,
        location: eventData.location,
        registration: {
          ...eventData.registration,
        },
        content: eventData.content,
        contact: eventData.contact,
        media: {
          ...eventData.media,
          imageUrl,
          resources: eventData.media?.resources || [],
        },
        tags: eventData.tags || [],
        slug: eventData.slug,
        responseSummary: responseSummary,
      };

      console.log(
        `Event ${eventDoc.id} final responseSummary:`,
        responseSummary
      );

      events.push(event);
    }

    // Sort all events by startTime (newest first for past events, oldest first for upcoming)
    events.sort((a, b) => a.schedule.startTime - b.schedule.startTime);

    // Categorize events
    const upcomingEvents: EventDisplay[] = [];
    const pastEvents: EventDisplay[] = [];

    for (const event of events) {
      if (isEventFuture(event.schedule) || isEventOngoing(event.schedule)) {
        // Future and ongoing events go to upcoming
        upcomingEvents.push(event);
      } else if (isEventPast(event.schedule)) {
        // Past events go to past
        pastEvents.push(event);
      }
    }

    // Sort upcoming events by proximity to current time (ongoing events first, then closest to furthest)
    upcomingEvents.sort((a, b) => {
      const now = Date.now();
      const aDistance = Math.abs(a.schedule.startTime - now);
      const bDistance = Math.abs(b.schedule.startTime - now);
      return aDistance - bDistance;
    });

    // Sort past events by proximity to current time (most recent first)
    pastEvents.sort((a, b) => {
      const now = Date.now();
      const aDistance = Math.abs(a.schedule.startTime - now);
      const bDistance = Math.abs(b.schedule.startTime - now);
      return aDistance - bDistance;
    });

    console.log(
      `Final events - Upcoming: ${upcomingEvents.length}, Past: ${pastEvents.length}`
    );
    console.log(
      "Upcoming events:",
      upcomingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        hasImage: !!e.media?.imageUrl,
      }))
    );
    console.log(
      "Past events:",
      pastEvents.map((e) => ({
        id: e.id,
        title: e.title,
        hasImage: !!e.media?.imageUrl,
      }))
    );

    return {
      upcomingEvents,
      pastEvents,
    };
  } catch (error) {
    console.error("Failed to fetch events page data:", error);

    // Return empty arrays on error
    return {
      upcomingEvents: [],
      pastEvents: [],
    };
  }
}

export async function getEventsPageContent(): Promise<EventsPageContent> {
  try {
    const db = getFirebaseAdminDb();

    // Fetch from the eventsPage collection
    const newPathDoc = await db.collection("eventsPage").doc("events").get();

    if (!newPathDoc.exists) {
      throw new Error("Events page data not found in pages/events");
    }

    const docData = newPathDoc.data();
    const eventsPageContent: EventsPageContent = {
      title: docData?.title || defaultEventsPageContent.title,
      subtitle: docData?.subtitle || defaultEventsPageContent.subtitle,
      showUpcomingSection:
        docData?.showUpcomingSection ??
        defaultEventsPageContent.showUpcomingSection,
      showPastSection:
        docData?.showPastSection ?? defaultEventsPageContent.showPastSection,
      upcomingSectionTitle:
        docData?.upcomingSectionTitle ||
        defaultEventsPageContent.upcomingSectionTitle,
      pastSectionTitle:
        docData?.pastSectionTitle || defaultEventsPageContent.pastSectionTitle,
      noEventsMessage:
        docData?.noEventsMessage || defaultEventsPageContent.noEventsMessage,
      noEventsSubtitle:
        docData?.noEventsSubtitle || defaultEventsPageContent.noEventsSubtitle,
    };

    return eventsPageContent;
  } catch (error) {
    console.error("Failed to fetch events page content:", error);
    return defaultEventsPageContent;
  }
}
