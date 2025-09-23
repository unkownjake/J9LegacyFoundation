"use server";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { SponsorshipApplicationContent } from "@/lib/types/sponsorshipApplication";
import { defaultSponsorshipApplicationContent } from "@/lib/defaults/sponsorshipApplicationDefaults";

export async function getSponsorshipApplicationData() {
  try {
    const db = getFirebaseAdminDb();

    // Fetch from the new path
    const newPathDoc = await db
      .collection("pages")
      .doc("sponsorshipApplication")
      .get();

    if (!newPathDoc.exists) {
      throw new Error(
        "Sponsorship application page data not found in pages/sponsorshipApplication"
      );
    }

    const docData = newPathDoc.data();
    const sponsorshipApplicationContent: SponsorshipApplicationContent = {
      title: docData?.title || defaultSponsorshipApplicationContent.title,
      subtitle:
        docData?.subtitle || defaultSponsorshipApplicationContent.subtitle,
      applicationHeader:
        docData?.applicationHeader ||
        defaultSponsorshipApplicationContent.applicationHeader,
      applicationDescription:
        docData?.applicationDescription ||
        defaultSponsorshipApplicationContent.applicationDescription,
      applicationRequirements:
        docData?.applicationRequirements ||
        defaultSponsorshipApplicationContent.applicationRequirements,
      sponsorshipLimit:
        docData?.sponsorshipLimit ||
        defaultSponsorshipApplicationContent.sponsorshipLimit,
      importantInfoHeader:
        docData?.importantInfoHeader ||
        defaultSponsorshipApplicationContent.importantInfoHeader,
      importantInfoItems:
        docData?.importantInfoItems ||
        defaultSponsorshipApplicationContent.importantInfoItems,
      ctaText: docData?.ctaText || defaultSponsorshipApplicationContent.ctaText,
      ctaLink: docData?.ctaLink || defaultSponsorshipApplicationContent.ctaLink,
    };

    return {
      sponsorshipApplicationContent,
    };
  } catch (error) {
    console.error("Failed to fetch sponsorship application page data:", error);

    // Return fallback data from defaults
    return {
      sponsorshipApplicationContent: defaultSponsorshipApplicationContent,
    };
  }
}
