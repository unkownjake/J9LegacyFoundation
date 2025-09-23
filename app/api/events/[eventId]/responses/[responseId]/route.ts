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

  const responses: EventResponse[] = responsesSnapshot.docs.map((doc) => {
    const data = doc.data();
    // Migration: if email is in fields, move it to top level
    if (!data.email && data.fields?.email) {
      data.email = data.fields.email;
      data.fields = { ...data.fields, email: undefined };
    }
    // Migration: convert participantCount to participants array
    if (data.participantCount && !data.participants) {
      data.participants = Array(data.participantCount).fill({});
      delete data.participantCount;
    }
    return {
      id: doc.id,
      ...data,
    } as EventResponse;
  });

  // Calculate new summary
  const responseSummary = calculateResponseSummary(responses);

  // Update the event document
  await db.collection("events").doc(eventId).update({ responseSummary });
}

// GET /api/events/[eventId]/responses/[responseId] - Get a specific response
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; responseId: string } }
) {
  try {
    const { eventId, responseId } = params;

    const db = getFirebaseAdminDb();
    const responseDoc = await db
      .collection("events")
      .doc(eventId)
      .collection("responses")
      .doc(responseId)
      .get();

    if (!responseDoc.exists) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    const data = responseDoc.data();
    if (!data) {
      return NextResponse.json(
        { error: "Response data not found" },
        { status: 404 }
      );
    }

    // Check if response has required email field
    if (!data.email || typeof data.email !== "string") {
      return NextResponse.json(
        { error: "Response is missing required email field" },
        { status: 400 }
      );
    }

    // Migration: convert participantCount to participants array
    if (data.participantCount && !data.participants) {
      data.participants = Array(data.participantCount).fill({});
      delete data.participantCount;
    }

    const response: EventResponse = {
      id: responseDoc.id,
      ...data,
    } as EventResponse;

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Error fetching event response:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[eventId]/responses/[responseId] - Update a response
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string; responseId: string } }
) {
  try {
    const { eventId, responseId } = params;
    const updateData: Partial<EventResponse> = await request.json();

    // Get event schema for validation only when core response fields are updated
    const db = getFirebaseAdminDb();
    const eventDoc = await db.collection("events").doc(eventId).get();
    const eventData = eventDoc.data();
    const eventSchema = eventData?.registration?.formSchema;

    const isCoreUpdate =
      typeof updateData.email !== "undefined" ||
      typeof updateData.type !== "undefined" ||
      typeof updateData.fields !== "undefined" ||
      typeof updateData.participants !== "undefined";

    if (isCoreUpdate) {
      // Validate only for core updates
      const validation = validateEventResponse(updateData, eventSchema);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.errors },
          { status: 400 }
        );
      }
    }

    const responseRef = db
      .collection("events")
      .doc(eventId)
      .collection("responses")
      .doc(responseId);

    // Remove id and time from update data (these shouldn't be updated)
    const { id, time, ...allowedUpdates } = updateData;

    await responseRef.update(allowedUpdates);

    // Update the event's response summary
    await updateEventResponseSummary(eventId);

    // Return updated response
    const updatedDoc = await responseRef.get();
    const updatedData = updatedDoc.data();
    if (!updatedData) {
      return NextResponse.json(
        { error: "Updated response data not found" },
        { status: 500 }
      );
    }
    // Migration: convert participantCount to participants array
    if (updatedData.participantCount && !updatedData.participants) {
      updatedData.participants = Array(updatedData.participantCount).fill({});
      delete updatedData.participantCount;
    }

    // Migration: if email is in fields, move it to top level
    const updatedResponse: EventResponse =
      !updatedData.email && updatedData.fields?.email
        ? ({
            id: updatedDoc.id,
            ...updatedData,
            email: updatedData.fields.email,
            fields: { ...updatedData.fields, email: undefined },
          } as EventResponse)
        : ({
            id: updatedDoc.id,
            ...updatedData,
          } as EventResponse);

    return NextResponse.json({ response: updatedResponse });
  } catch (error: any) {
    console.error("Error updating event response:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[eventId]/responses/[responseId] - Delete a response
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; responseId: string } }
) {
  try {
    const { eventId, responseId } = params;

    const db = getFirebaseAdminDb();
    const responseRef = db
      .collection("events")
      .doc(eventId)
      .collection("responses")
      .doc(responseId);

    await responseRef.delete();

    // Update the event's response summary
    await updateEventResponseSummary(eventId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting event response:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
