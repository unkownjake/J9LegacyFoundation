import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminStorage } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/requireUser";

export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Path parameter is required" },
        { status: 400 }
      );
    }

    const storage = getFirebaseAdminStorage();
    const file = storage.bucket().file(path);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete the file
    await file.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
