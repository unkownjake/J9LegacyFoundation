"use client";

import { useState, useEffect } from "react";
import { getHomePageData } from "./account";
import { HomePageCardContent, HeroContent } from "@/lib/types/home";
import { HomePage } from "./home/HomePageContent";

export default function Home() {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [homepageCards, setHomepageCards] = useState<HomePageCardContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getHomePageData();
        setHero(data.hero);
        setHomepageCards(data.homepageCards);
      } catch (error) {
        console.error("Failed to fetch home page data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HomePage
      hero={hero || undefined}
      homepageCards={homepageCards || undefined}
    />
  );
}
