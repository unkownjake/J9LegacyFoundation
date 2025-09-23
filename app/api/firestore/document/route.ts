import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/requireUser";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");
    const documentId = searchParams.get("id");
    const path = searchParams.get("path");

    if (!path && (!collection || !documentId)) {
      return NextResponse.json(
        { error: "Collection and document ID are required" },
        { status: 400 }
      );
    }

    const db = getFirebaseAdminDb();
    const docRef = path ? db.doc(path) : db.doc(`${collection}/${documentId}`);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const documentData = {
      id: docSnap.id,
      ...docSnap.data(),
    };

    return NextResponse.json(documentData);
  } catch (error: any) {
    console.error("Firestore document GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication for write operations
    const user = await requireUser(request);

    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");
    const documentId = searchParams.get("id");
    const path = searchParams.get("path");

    if (!path && (!collection || !documentId)) {
      return NextResponse.json(
        { error: "Collection and document ID are required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const db = getFirebaseAdminDb();
    const docRef = path ? db.doc(path) : db.doc(`${collection}/${documentId}`);

    await docRef.set({
      ...body,
      createdBy: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      id: path ? docRef.id : documentId,
      message: "Document created successfully",
    });
  } catch (error: any) {
    // Handle authentication errors specifically
    if (error instanceof Response) {
      return error; // Return the original error response (401, etc.)
    }

    console.error("Firestore document POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require authentication for write operations
    const user = await requireUser(request);

    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");
    const documentId = searchParams.get("id");
    const path = searchParams.get("path");

    if (!path && (!collection || !documentId)) {
      return NextResponse.json(
        { error: "Collection and document ID are required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const db = getFirebaseAdminDb();
    const docRef = path ? db.doc(path) : db.doc(`${collection}/${documentId}`);

    await docRef.update({
      ...body,
      updatedBy: user.uid,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      message: "Document updated successfully",
    });
  } catch (error: any) {
    // Handle authentication errors specifically
    if (error instanceof Response) {
      return error; // Return the original error response (401, etc.)
    }

    console.error("Firestore document PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require authentication for write operations
    const user = await requireUser(request);

    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");
    const documentId = searchParams.get("id");
    const path = searchParams.get("path");

    if (!path && (!collection || !documentId)) {
      return NextResponse.json(
        { error: "Collection and document ID are required" },
        { status: 400 }
      );
    }

    const db = getFirebaseAdminDb();
    const docRef = path ? db.doc(path) : db.doc(`${collection}/${documentId}`);

    await docRef.delete();

    return NextResponse.json({
      message: "Document deleted successfully",
    });
  } catch (error: any) {
    // Handle authentication errors specifically
    if (error instanceof Response) {
      return error; // Return the original error response (401, etc.)
    }

    console.error("Firestore document DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
