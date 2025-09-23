"use client";

import { useState, useEffect } from "react";
import { getAboutPageData } from "./account";
import { AboutPageContent } from "@/lib/types/about";
import { defaultAboutPageContent } from "@/lib/defaults/aboutDefaults";
import AboutPage from "./AboutPageContent";

export default function About() {
  const [aboutPageContent, setAboutPageContent] =
    useState<AboutPageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAboutPageData();
        setAboutPageContent(data.aboutPageContent);
      } catch (error) {
        console.error("Failed to fetch about page data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-secondary">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!aboutPageContent) {
    return <AboutPage aboutPageContent={defaultAboutPageContent} />;
  }

  return <AboutPage aboutPageContent={aboutPageContent} />;
}
