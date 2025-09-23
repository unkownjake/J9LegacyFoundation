import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminStorage } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix") || "";
    const maxResults = parseInt(searchParams.get("maxResults") || "100");
    const pageToken = searchParams.get("pageToken") || "";

    const storage = getFirebaseAdminStorage();
    const bucket = storage.bucket();

    // List files with optional prefix filtering
    const [files, nextPageToken] = await bucket.getFiles({
      prefix,
      maxResults,
      pageToken: pageToken || undefined,
    });

    // Get metadata for each file
    const fileList = await Promise.all(
      files.map(async (file) => {
        try {
          const [metadata] = await file.getMetadata();
          const [url] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 3600 * 1000, // 1 hour expiration
          });

          return {
            name: file.name,
            path: file.name,
            size: metadata.size,
            contentType: metadata.contentType,
            updated: metadata.updated,
            url,
            metadata: metadata.metadata || {},
            customMetadata: metadata.metadata?.customMetadata || {},
          };
        } catch (error) {
          console.warn(`Failed to get metadata for ${file.name}:`, error);
          return {
            name: file.name,
            path: file.name,
            size: 0,
            contentType: "unknown",
            updated: new Date().toISOString(),
            url: "",
            metadata: {},
            customMetadata: {},
          };
        }
      })
    );

    return NextResponse.json({
      files: fileList,
      nextPageToken: nextPageToken || null,
      prefix,
      totalCount: fileList.length,
    });
  } catch (error: any) {
    console.error("Storage list API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
