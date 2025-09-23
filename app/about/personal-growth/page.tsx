"use client";

import { useState, useEffect } from "react";
import { getPersonalGrowthData } from "./account";
import { PersonalGrowthContent } from "@/lib/types/personalGrowth";
import { defaultPersonalGrowthContent } from "@/lib/defaults/personalGrowthDefaults";
import PersonalGrowthPage from "./PersonalGrowthPageContent";

export default function PersonalGrowthPageWrapper() {
  const [personalGrowthContent, setPersonalGrowthContent] =
    useState<PersonalGrowthContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPersonalGrowthData();
        setPersonalGrowthContent(data.personalGrowthContent);
      } catch (error) {
        console.error("Failed to fetch personal growth page data:", error);
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

  if (!personalGrowthContent) {
    return (
      <PersonalGrowthPage
        personalGrowthContent={defaultPersonalGrowthContent}
      />
    );
  }

  return <PersonalGrowthPage personalGrowthContent={personalGrowthContent} />;
}
