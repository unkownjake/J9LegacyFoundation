"use server";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { CampSponsorshipContent } from "@/lib/types/campSponsorship";
import { defaultCampSponsorshipContent } from "@/lib/defaults/campSponsorshipDefaults";

export async function getCampSponsorshipData() {
  try {
    const db = getFirebaseAdminDb();
    const storage = getStorage();
    let campSponsorshipContent: CampSponsorshipContent | null = null;

    // Prefer new path: pages/about/subpages/campSponsorships (single document)
    const docSnap = await db.doc("pages/about/subpages/campSponsorships").get();

    if (!docSnap.exists) {
      throw new Error("Camp sponsorship page data not found");
    }

    const docData = docSnap.data() as any;

    // Get signed URLs for images if they exist
    let heroImageUrl =
      docData.heroImage || defaultCampSponsorshipContent.imageA;
    let secondaryImageUrl =
      docData.secondaryImage || defaultCampSponsorshipContent.imageB;

    console.log("heroImageUrl", heroImageUrl);
    console.log("secondaryImageUrl", secondaryImageUrl);

    if (
      heroImageUrl &&
      !heroImageUrl.startsWith("http") &&
      !heroImageUrl.startsWith("blob:")
    ) {
      try {
        const bucket = storage.bucket();
        const file = bucket.file(heroImageUrl);
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 1000 * 60 * 60, // 1 hour expiry
        });
        heroImageUrl = url;
      } catch (error) {
        console.error(
          `Failed to get signed URL for ${docData.heroImage}:`,
          error
        );
        heroImageUrl =
          docData.heroImage || defaultCampSponsorshipContent.imageA;
      }
    }

    if (
      secondaryImageUrl &&
      !secondaryImageUrl.startsWith("http") &&
      !secondaryImageUrl.startsWith("blob:")
    ) {
      try {
        const bucket = storage.bucket();
        const file = bucket.file(secondaryImageUrl);
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 1000 * 60 * 60, // 1 hour expiry
        });
        secondaryImageUrl = url;
      } catch (error) {
        console.error(
          `Failed to get signed URL for ${docData.secondaryImage}:`,
          error
        );
        secondaryImageUrl =
          docData.secondaryImage || defaultCampSponsorshipContent.imageB;
      }
    }

    campSponsorshipContent = {
      title: docData.title || defaultCampSponsorshipContent.title,
      imageA: heroImageUrl,
      imageB: secondaryImageUrl,
      infoTitle:
        docData.introduction || defaultCampSponsorshipContent.infoTitle,
      infoText: docData.mission || defaultCampSponsorshipContent.infoText,
      campSponsorships:
        docData.campSponsorships ||
        defaultCampSponsorshipContent.campSponsorships,
      conclusion:
        docData.conclusion || defaultCampSponsorshipContent.conclusion,
    };

    return {
      campSponsorshipContent,
    };
  } catch (error) {
    console.error("Failed to fetch camp sponsorship page data:", error);

    // Return fallback data from defaults
    return {
      campSponsorshipContent: defaultCampSponsorshipContent,
    };
  }
}
