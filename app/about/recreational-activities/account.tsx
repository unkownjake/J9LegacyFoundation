"use server";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { RecreationalActivitiesContent } from "@/lib/types/recreationalActivities";
import { defaultRecreationalActivitiesContent } from "@/lib/defaults/recreationalActivitiesDefaults";

export async function getRecreationalActivitiesData() {
  try {
    const db = getFirebaseAdminDb();
    const storage = getStorage();

    // Fetch from the new path
    const newDocSnap = await db
      .doc("pages/about/subpages/recreationalActivities")
      .get();

    if (!newDocSnap.exists) {
      throw new Error(
        "Recreational activities page data not found in pages/about/subpages/recreationalActivities"
      );
    }

    const docData = newDocSnap.data() as any;

    // Get signed URL for image if it exists
    let imageUrl = docData.image || defaultRecreationalActivitiesContent.image;

    if (
      imageUrl &&
      !imageUrl.startsWith("http") &&
      !imageUrl.startsWith("blob:")
    ) {
      try {
        const bucket = storage.bucket();
        const file = bucket.file(imageUrl);
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 1000 * 60 * 60,
        });
        imageUrl = url;
      } catch (error) {
        console.error(`Failed to get signed URL for ${docData.image}:`, error);
        imageUrl = docData.image || defaultRecreationalActivitiesContent.image;
      }
    }

    const recreationalActivitiesContent: RecreationalActivitiesContent = {
      title: docData.title || defaultRecreationalActivitiesContent.title,
      image: imageUrl,
      infoText:
        docData.infoText || defaultRecreationalActivitiesContent.infoText,
      currentInitiativesHeader:
        docData.currentInitiativesHeader ||
        defaultRecreationalActivitiesContent.currentInitiativesHeader,
      currentInitiatives:
        docData.currentInitiatives ||
        defaultRecreationalActivitiesContent.currentInitiatives,
      futureOutlook:
        docData.futureOutlook ||
        defaultRecreationalActivitiesContent.futureOutlook,
    };

    return {
      recreationalActivitiesContent,
    };
  } catch (error) {
    console.error("Failed to fetch recreational activities page data:", error);

    // Return fallback data from defaults
    return {
      recreationalActivitiesContent: defaultRecreationalActivitiesContent,
    };
  }
}
