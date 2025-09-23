import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminStorage } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const expiresIn = searchParams.get("expiresIn") || "3600"; // Default 1 hour

    if (!path) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    const storage = getFirebaseAdminStorage();
    const bucket = storage.bucket();
    const fileRef = bucket.file(path);

    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Get signed URL
    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + Number(expiresIn) * 1000,
    });

    // Return JSON with the signed URL
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Storage URL API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
