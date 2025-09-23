import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import {
  EventResponse,
  calculateResponseSummary,
  validateEventResponse,
} from "@/lib/types/events";

// Helper function to update event's response summary
async function updateEventResponseSummary(eventId: string) {
  const db = getFirebaseAdminDb();

  // Get all responses for this event
  const responsesSnapshot = await db
    .collection("events")
    .doc(eventId)
    .collection("responses")
    .get();

  const responses: EventResponse[] = responsesSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      // Migration: convert participantCount to participants array
      if (data.participantCount && !data.participants) {
        data.participants = Array(data.participantCount).fill({});
        delete data.participantCount;
      }
      return {
        id: doc.id,
        ...data,
      } as EventResponse;
    })
    .filter((data): data is EventResponse => {
      // Only include responses that have the required email field
      return Boolean(data.email && typeof data.email === "string");
    });

  // Calculate new summary
  const responseSummary = calculateResponseSummary(responses);

  // Update the event document
  await db.collection("events").doc(eventId).update({ responseSummary });
}

// GET /api/events/[eventId]/responses - Get all responses for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // Optional filter by status

    const db = getFirebaseAdminDb();
    const responsesRef = db
      .collection("events")
      .doc(eventId)
      .collection("responses");

    let query = responsesRef.orderBy("time", "desc");

    // Filter by status if provided
    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();
    const responses: EventResponse[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        // Migration: convert participantCount to participants array
        if (data.participantCount && !data.participants) {
          data.participants = Array(data.participantCount).fill({});
          delete data.participantCount;
        }
        return {
          id: doc.id,
          ...data,
        } as EventResponse;
      })
      .filter((data): data is EventResponse => {
        // Only include responses that have the required email field
        return Boolean(data.email && typeof data.email === "string");
      });

    return NextResponse.json({ responses });
  } catch (error: any) {
    console.error("Error fetching event responses:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/events/[eventId]/responses - Create a new response
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const responseData: Omit<EventResponse, "id" | "time"> =
      await request.json();

    // Get event schema for validation
    const db = getFirebaseAdminDb();
    const eventDoc = await db.collection("events").doc(eventId).get();
    const eventData = eventDoc.data();
    const eventSchema = eventData?.registration?.formSchema;

    // Validate the response data
    const validation = validateEventResponse(responseData, eventSchema);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const responsesRef = db
      .collection("events")
      .doc(eventId)
      .collection("responses");

    // Add timestamp (eventId is implicit in the path)
    const newResponse: Omit<EventResponse, "id"> = {
      ...responseData,
      time: Date.now(),
    };

    const docRef = await responsesRef.add(newResponse);

    // Update the event's response summary
    await updateEventResponseSummary(eventId);

    return NextResponse.json({
      id: docRef.id,
      ...newResponse,
    });
  } catch (error: any) {
    console.error("Error creating event response:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
