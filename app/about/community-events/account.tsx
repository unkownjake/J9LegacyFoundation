"use server";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { CommunityEventsContent } from "@/lib/types/communityEvents";
import { defaultCommunityEventsContent } from "@/lib/defaults/communityEventsDefaults";

export async function getCommunityEventsData() {
  try {
    const db = getFirebaseAdminDb();
    const storage = getStorage();
    // Fetch from the new path
    const docSnap = await db.doc("pages/about/subpages/communityEvents").get();

    if (!docSnap.exists) {
      throw new Error(
        "Community events page data not found in pages/about/subpages/communityEvents"
      );
    }

    const docData = docSnap.data() as any;

    // Get signed URLs for images if they exist
    let imageAUrl = docData.imageA || defaultCommunityEventsContent.imageA;
    let imageBUrl = docData.imageB || defaultCommunityEventsContent.imageB;

    if (
      imageAUrl &&
      !imageAUrl.startsWith("http") &&
      !imageAUrl.startsWith("blob:")
    ) {
      try {
        const bucket = storage.bucket();
        const file = bucket.file(imageAUrl);
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 1000 * 60 * 60, // 1 hour expiry
        });
        imageAUrl = url;
      } catch (error) {
        console.error(`Failed to get signed URL for ${docData.imageA}:`, error);
        imageAUrl = docData.imageA || defaultCommunityEventsContent.imageA;
      }
    }

    if (
      imageBUrl &&
      !imageBUrl.startsWith("http") &&
      !imageBUrl.startsWith("blob:")
    ) {
      try {
        const bucket = storage.bucket();
        const file = bucket.file(imageBUrl);
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 1000 * 60 * 60, // 1 hour expiry
        });
        imageBUrl = url;
      } catch (error) {
        console.error(`Failed to get signed URL for ${docData.imageB}:`, error);
        imageBUrl = docData.imageB || defaultCommunityEventsContent.imageB;
      }
    }

    const communityEventsContent: CommunityEventsContent = {
      title: docData.title || defaultCommunityEventsContent.title,
      imageA: imageAUrl,
      imageB: imageBUrl,
      infoTitle: docData.infoTitle || defaultCommunityEventsContent.infoTitle,
      infoText: docData.infoText || defaultCommunityEventsContent.infoText,
      annualEventsHeader:
        docData.annualEventsHeader ||
        defaultCommunityEventsContent.annualEventsHeader,
      annualEvents:
        docData.annualEvents || defaultCommunityEventsContent.annualEvents,
      ongoingInitiativesHeader:
        docData.ongoingInitiativesHeader ||
        defaultCommunityEventsContent.ongoingInitiativesHeader,
      ongoingInitiatives:
        docData.ongoingInitiatives ||
        defaultCommunityEventsContent.ongoingInitiatives,
      conclusion:
        docData.conclusion || defaultCommunityEventsContent.conclusion,
    };

    return {
      communityEventsContent,
    };
  } catch (error) {
    console.error("Failed to fetch community events page data:", error);

    // Return fallback data from defaults
    return {
      communityEventsContent: defaultCommunityEventsContent,
    };
  }
}
