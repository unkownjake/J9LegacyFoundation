"use server";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { FAQPageContent } from "@/lib/types/faq";
import { defaultFAQPageContent } from "@/lib/defaults/faqDefaults";

export async function getFAQPageData() {
  try {
    const db = getFirebaseAdminDb();

    // Fetch from the new path
    const newPathDoc = await db.collection("pages").doc("faq").get();

    if (!newPathDoc.exists) {
      throw new Error("FAQ page data not found in pages/faq");
    }

    const docData = newPathDoc.data();
    const faqPageContent: FAQPageContent = {
      title: docData?.title || defaultFAQPageContent.title,
      description: docData?.description || defaultFAQPageContent.description,
      faqs: docData?.faqs || defaultFAQPageContent.faqs,
    };

    return {
      faqPageContent,
    };
  } catch (error) {
    console.error("Error fetching FAQ page data:", error);
    return {
      faqPageContent: defaultFAQPageContent,
    };
  }
}
