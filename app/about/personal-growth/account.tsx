"use server";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { PersonalGrowthContent } from "@/lib/types/personalGrowth";
import { defaultPersonalGrowthContent } from "@/lib/defaults/personalGrowthDefaults";

export async function getPersonalGrowthData() {
  try {
    const db = getFirebaseAdminDb();
    const storage = getStorage();

    // Fetch from the new path
    const newDocSnap = await db
      .doc("pages/about/subpages/personalGrowth")
      .get();

    if (!newDocSnap.exists) {
      throw new Error(
        "Personal growth page data not found in pages/about/subpages/personalGrowth"
      );
    }

    const docData = newDocSnap.data() as any;

    let imageUrl = docData.image || defaultPersonalGrowthContent.image;

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
        imageUrl = docData.image || defaultPersonalGrowthContent.image;
      }
    }

    const personalGrowthContent: PersonalGrowthContent = {
      title: docData.title || defaultPersonalGrowthContent.title,
      image: imageUrl,
      introText: docData.introText || defaultPersonalGrowthContent.introText,
      confidenceHeader:
        docData.confidenceHeader ||
        defaultPersonalGrowthContent.confidenceHeader,
      confidenceText:
        docData.confidenceText || defaultPersonalGrowthContent.confidenceText,
      friendshipHeader:
        docData.friendshipHeader ||
        defaultPersonalGrowthContent.friendshipHeader,
      friendshipText:
        docData.friendshipText || defaultPersonalGrowthContent.friendshipText,
      joyHeader: docData.joyHeader || defaultPersonalGrowthContent.joyHeader,
      joyText: docData.joyText || defaultPersonalGrowthContent.joyText,
      conclusion: docData.conclusion || defaultPersonalGrowthContent.conclusion,
    };

    return {
      personalGrowthContent,
    };
  } catch (error) {
    console.error("Failed to fetch personal growth page data:", error);
    return {
      personalGrowthContent: defaultPersonalGrowthContent,
    };
  }
}
