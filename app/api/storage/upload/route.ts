import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminStorage } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/requireUser";

export async function POST(request: NextRequest) {
  try {
    // Require authentication for file uploads
    const user = await requireUser(request);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;
    const metadata = formData.get("metadata") as string;

    if (!file || !path) {
      return NextResponse.json(
        { error: "File and path are required" },
        { status: 400 }
      );
    }

    const storage = getFirebaseAdminStorage();
    const bucket = storage.bucket();

    // Parse metadata if provided
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        console.warn("Invalid metadata format:", metadata);
      }
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Firebase Storage
    const fileRef = bucket.file(path);
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: parsedMetadata,
        customMetadata: {
          originalName: file.name,
          size: file.size.toString(),
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.uid,
        },
      },
    });

    // Get public URL
    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: "03-01-2500", // Far future expiration
    });

    return NextResponse.json({
      success: true,
      url,
      path,
      size: file.size,
      contentType: file.type,
    });
  } catch (error: any) {
    // Handle authentication errors specifically
    if (error instanceof Response) {
      return error; // Return the original error response (401, etc.)
    }

    console.error("Storage upload API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
