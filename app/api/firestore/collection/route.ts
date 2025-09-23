import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/requireUser";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");
    const path = searchParams.get("path");

    if (!path && !collection) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 }
      );
    }

    const db = getFirebaseAdminDb();
    const collectionRef = path
      ? db.collection(path)
      : db.collection(collection!);
    const snapshot = await collectionRef.get();

    const documents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error("Firestore collection GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require authentication for collection operations
    const user = await requireUser(request);

    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");
    const path = searchParams.get("path");

    if (!path && !collection) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 }
      );
    }

    const db = getFirebaseAdminDb();
    const collectionRef = path
      ? db.collection(path)
      : db.collection(collection!);

    // Get all documents in the collection
    const snapshot = await collectionRef.get();

    // Delete all documents
    const deletePromises = snapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);

    return NextResponse.json({
      message: `Collection '${collection}' cleared successfully`,
      deletedCount: snapshot.docs.length,
    });
  } catch (error: any) {
    // Handle authentication errors specifically
    if (error instanceof Response) {
      return error; // Return the original error response (401, etc.)
    }

    console.error("Firestore collection DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
