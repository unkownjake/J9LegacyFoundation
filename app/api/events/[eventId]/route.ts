import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { EventPayload } from "@/lib/types/events";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const db = getFirebaseAdminDb();

    // Check if event exists
    const eventRef = db.collection("events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Delete the event
    await eventRef.delete();

    // Also delete any associated registrations
    const registrationsSnapshot = await db
      .collection("eventRegistrations")
      .where("eventId", "==", eventId)
      .get();

    const batch = db.batch();
    registrationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const db = getFirebaseAdminDb();

    // Get the event
    const eventDoc = await db.collection("events").doc(eventId).get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventData = eventDoc.data();

    // Use responseSummary for currentCapacity if available
    const currentCapacity = eventData?.responseSummary?.totalParticipants || 0;

    const event = {
      id: eventDoc.id,
      ...eventData,
      location: eventData?.location || {
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
        ...eventData?.registration,
      },
      content: {
        highlights: [],
        whatToBring: [],
        ageRange: undefined,
        skillLevel: undefined,
        activities: [],
        ...eventData?.content,
      },
      contact: {
        organizerName: "",
        organizerEmail: "",
        organizerPhone: undefined,
        ...eventData?.contact,
      },
      media: {
        imagePath: undefined,
        imageUrl: undefined,
        flyerUrl: undefined,
        videoUrl: undefined,
        googlePhotosAlbumUrl: undefined,
        resources: eventData?.media?.resources || [],
        ...eventData?.media,
      },
      tags: eventData?.tags || [],
    };

    return NextResponse.json({ event });
  } catch (error: any) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;
    const body = await request.json();
    const eventData: EventPayload = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    if (!eventData.title || !eventData.description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const db = getFirebaseAdminDb();

    // Check if event exists
    const eventRef = db.collection("events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Generate slug from title if it changed
    const currentData = eventDoc.data();
    let slug = currentData?.slug;

    if (currentData?.title !== eventData.title) {
      slug = eventData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Update the event document
    const updateData = {
      ...eventData,
      slug,
      updatedAt: Date.now(),
      updatedBy: "admin", // In a real app, this would be the user ID
    };

    await eventRef.update(updateData);

    // Fetch the updated event data to return
    const updatedEventDoc = await eventRef.get();
    const updatedEventData = updatedEventDoc.data();

    const event = {
      id: eventDoc.id,
      ...updatedEventData,
      registration: {
        ...updatedEventData?.registration,
      },
      media: {
        ...updatedEventData?.media,
        resources: updatedEventData?.media?.resources || [],
      },
    };

    return NextResponse.json({
      success: true,
      id: eventId,
      slug,
      event,
    });
  } catch (error: any) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
