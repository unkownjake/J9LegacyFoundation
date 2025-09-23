"use server";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { AboutPageContent } from "@/lib/types/about";
import { defaultAboutPageContent } from "@/lib/defaults/aboutDefaults";
import { getStorage } from "firebase-admin/storage";

export async function getAboutPageData() {
  try {
    const db = getFirebaseAdminDb();
    const storage = getStorage();
    // Fetch from the new path
    const aboutDocSnap = await db.doc("pages/about").get();

    if (!aboutDocSnap.exists) {
      throw new Error("About page data not found in pages/about");
    }

    const docData = aboutDocSnap.data() as any;
    let imageUrl = docData.image || defaultAboutPageContent.image;

    // If the page has an image path, get the actual URL from Google Cloud Storage
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
          expires: Date.now() + 1000 * 60 * 60, // 1 hour expiry
        });
        imageUrl = url;
      } catch (error) {
        console.error(`Failed to get signed URL for ${imageUrl}:`, error);
        // Keep the original path if we can't get a signed URL
        imageUrl = docData.image || defaultAboutPageContent.image;
      }
    }

    const aboutPageContent: AboutPageContent = {
      title: docData.title || defaultAboutPageContent.title,
      missionSectionText:
        docData.mission || defaultAboutPageContent.missionSectionText,
      image: imageUrl,
      impactHeader:
        docData.impactHeader || defaultAboutPageContent.impactHeader,
      impactSubheader:
        docData.impactSubheader || defaultAboutPageContent.impactSubheader,
      impactCards: docData.impactCards || defaultAboutPageContent.impactCards,
      impactFooter:
        docData.impactFooter || defaultAboutPageContent.impactFooter,
    };

    return {
      aboutPageContent,
    };
  } catch (error) {
    console.error("Failed to fetch about page data:", error);

    // Return fallback data from defaults
    return {
      aboutPageContent: defaultAboutPageContent,
    };
  }
}
