"use server";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { HomePageCardContent, HeroContent } from "@/lib/types/home";
import { defaultHomePageData } from "@/lib/defaults/homeDefaults";
import { getStorage } from "firebase-admin/storage";

export async function getHomePageData() {
  try {
    const db = getFirebaseAdminDb();
    const storage = getStorage();

    // Fetch from the new path
    const newPathDoc = await db.collection("pages").doc("home").get();

    if (!newPathDoc.exists) {
      throw new Error("Home page data not found in pages/home");
    }

    const homePageData = newPathDoc.data();

    if (!homePageData) {
      throw new Error("Home page data is empty or corrupted");
    }

    // Process the data
    const hero: HeroContent | null = homePageData.hero
      ? {
          title: homePageData.hero.title || defaultHomePageData.hero.title,
          description:
            homePageData.hero.description ||
            defaultHomePageData.hero.description,
        }
      : null;

    const homepageCards: HomePageCardContent[] = await Promise.all(
      (homePageData.homepageCards || [])
        .filter((card: any) => card.title && card.description)
        .map(async (cardData: any) => {
          let imageUrl = cardData.image;

          // If the card has an image path, get the actual URL from Google Cloud Storage
          if (
            cardData.image &&
            !cardData.image.startsWith("http") &&
            !cardData.image.startsWith("blob:")
          ) {
            try {
              const bucket = storage.bucket();
              const file = bucket.file(cardData.image);
              const [url] = await file.getSignedUrl({
                action: "read",
                expires: Date.now() + 1000 * 60 * 60, // 1 hour expiry
              });
              imageUrl = url;
            } catch (error) {
              console.error(
                `Failed to get signed URL for ${cardData.image}:`,
                error
              );
              // Keep the original path if we can't get a signed URL
              imageUrl = cardData.image;
              console.log("keeping imageUrl", imageUrl);
            }
          }

          return {
            id: cardData.id || `card-${Date.now()}`,
            title: cardData.title,
            description: cardData.description,
            icon: cardData.icon,
            link: cardData.link,
            image: imageUrl,
            verticalPosition: cardData.verticalPosition || "center",
            order: cardData.order || 999, // Default order for sorting
          };
        })
    );

    return {
      hero,
      homepageCards,
    };
  } catch (error) {
    console.error("Failed to fetch home page data:", error);

    // Return fallback data from defaults
    return defaultHomePageData;
  }
}
