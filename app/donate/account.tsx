"use server";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { DonatePageContent } from "@/lib/types/donate";
import { defaultDonatePageContent } from "@/lib/defaults/donateDefaults";

export async function getDonatePageData() {
  try {
    const db = getFirebaseAdminDb();

    // Fetch from the new path
    const newPathDoc = await db.collection("pages").doc("donate").get();

    if (!newPathDoc.exists) {
      throw new Error("Donate page data not found in pages/donate");
    }

    const docData = newPathDoc.data();
    const donatePageContent: DonatePageContent = {
      title: docData?.title || defaultDonatePageContent.title,
      subtitle: docData?.subtitle || defaultDonatePageContent.subtitle,
      impactTitle: docData?.impactTitle || defaultDonatePageContent.impactTitle,
      impactText: docData?.impactText || defaultDonatePageContent.impactText,
    };

    return {
      donatePageContent,
    };
  } catch (error) {
    console.error("Failed to fetch donate page data:", error);

    // Return fallback data from defaults
    return {
      donatePageContent: defaultDonatePageContent,
    };
  }
}
