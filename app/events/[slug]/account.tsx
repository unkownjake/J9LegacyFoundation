"use server";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { Event, EventDisplay } from "@/lib/types/events";
import { notFound } from "next/navigation";
import { getStorage } from "firebase-admin/storage";

export async function getEventBySlug(slug: string): Promise<EventDisplay> {
  try {
    const db = getFirebaseAdminDb();

    // Fetch event by slug
    const eventsSnapshot = await db
      .collection("events")
      .where("slug", "==", slug)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (eventsSnapshot.empty) {
      notFound();
    }

    const eventDoc = eventsSnapshot.docs[0];
    const eventData = eventDoc.data();

    // Process image URL if it exists (using imagePath, not imageUrl)
    const storage = getStorage();
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

    // Create EventDisplay object with proper defaults
    const event: EventDisplay = {
      id: eventDoc.id,
      title: eventData.title,
      description: eventData.description,
      shortDescription: eventData.shortDescription,
      isFeatured: eventData.isFeatured || false,
      schedule: eventData.schedule,
      location: eventData.location || {
        name: "",
        city: "",
        state: "",
      },
      registration: {
        type: "dropin",
        maxCapacity: undefined,
        cost: undefined,
        deadline: undefined,
        formSchema: undefined,
        ...eventData.registration,
      },
      content: {
        highlights: [],
        whatToBring: [],
        ageRange: undefined,
        skillLevel: undefined,
        activities: [],
        ...eventData.content,
      },
      media: {
        imagePath: eventData.media?.imagePath,
        imageUrl: imageUrl, // Use the processed imageUrl
        flyerUrl: eventData.media?.flyerUrl,
        videoUrl: eventData.media?.videoUrl,
        googlePhotosAlbumUrl: eventData.media?.googlePhotosAlbumUrl,
        resources: eventData.media?.resources || [],
      },
      contact: {
        organizerName: "",
        organizerEmail: "",
        organizerPhone: undefined,
        ...eventData.contact,
      },
      tags: eventData.tags || [],
      slug: eventData.slug,
      postEventContent: eventData.postEventContent,
      responseSummary: eventData.responseSummary,
    };

    return event;
  } catch (error) {
    console.error("Failed to fetch event data:", error);
    notFound();
  }
}

// Get all events for navigation (previous/next event links)
export async function getAllEventSlugs(): Promise<
  { slug: string; title: string; schedule: { startTime: number } }[]
> {
  try {
    const db = getFirebaseAdminDb();

    const eventsSnapshot = await db
      .collection("events")
      .where("isActive", "==", true)
      .get();

    // Sort in memory instead of using orderBy to avoid composite index requirement
    const events = eventsSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }))
      .sort((a, b) => b.data.schedule.startTime - a.data.schedule.startTime);

    if (events.length === 0) {
      return [];
    }

    return events.map(({ data }) => ({
      slug: data.slug,
      title: data.title,
      schedule: data.schedule,
    }));
  } catch (error) {
    console.error("Failed to fetch event slugs:", error);
    return [];
  }
}
