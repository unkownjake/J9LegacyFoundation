import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { EventDisplay, EventPayload } from "@/lib/types/events";

export async function GET() {
  try {
    const db = getFirebaseAdminDb();

    // Fetch all events (including inactive ones for admin)
    const eventsSnapshot = await db.collection("events").get();

    if (eventsSnapshot.empty) {
      return NextResponse.json({ events: [] });
    }

    const events: EventDisplay[] = [];

    // Process each event
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();

      // Create EventDisplay object with proper defaults
      const event: EventDisplay = {
        id: eventDoc.id,
        title: eventData.title,
        description: eventData.description,
        shortDescription: eventData.shortDescription,
        schedule: eventData.schedule,
        location: eventData.location || {
          name: "",
          city: "",
          state: "",
        },
        responseSummary: eventData.responseSummary,
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
        contact: {
          organizerName: "",
          organizerEmail: "",
          organizerPhone: undefined,
          ...eventData.contact,
        },
        media: {
          imagePath: undefined,
          imageUrl: undefined,
          flyerUrl: undefined,
          videoUrl: undefined,
          googlePhotosAlbumUrl: undefined,
          resources: eventData.media?.resources || [],
          ...eventData.media,
        },
        tags: eventData.tags || [],
        slug: eventData.slug,
        postEventContent: eventData.postEventContent,
      };

      events.push(event);
    }

    // Sort events by startTime (newest first)
    events.sort((a, b) => b.schedule.startTime - a.schedule.startTime);

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventData: EventPayload = body;

    if (!eventData.title || !eventData.description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const db = getFirebaseAdminDb();

    // Generate slug from title
    const slug = eventData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Create the event document
    const eventDoc = {
      ...eventData,
      slug,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "admin", // In a real app, this would be the user ID
      updatedBy: "admin",
      isActive: eventData.isActive !== false,
    };

    const docRef = await db.collection("events").add(eventDoc);

    // Fetch the created event to return complete data
    const createdEventDoc = await docRef.get();
    const createdEventData = createdEventDoc.data();

    if (!createdEventData) {
      throw new Error("Failed to retrieve created event data");
    }

    // Create EventDisplay object
    const event: EventDisplay = {
      id: createdEventDoc.id,
      title: createdEventData.title,
      description: createdEventData.description,
      shortDescription: createdEventData.shortDescription,
      schedule: createdEventData.schedule,
      location: createdEventData.location,
      registration: {
        ...createdEventData.registration,
        currentCapacity: 0, // New events start with 0 capacity
      },
      content: createdEventData.content,
      contact: createdEventData.contact,
      media: {
        ...createdEventData.media,
        resources: createdEventData.media?.resources || [],
      },
      tags: createdEventData.tags || [],
      slug: createdEventData.slug,
      postEventContent: createdEventData.postEventContent,
    };

    return NextResponse.json({
      success: true,
      id: docRef.id,
      slug,
      event,
    });
  } catch (error: any) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
