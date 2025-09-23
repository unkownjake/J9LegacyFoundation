"use client";

import { useState, useEffect } from "react";
import { getRecreationalActivitiesData } from "./account";
import { RecreationalActivitiesContent } from "@/lib/types/recreationalActivities";
import { defaultRecreationalActivitiesContent } from "@/lib/defaults/recreationalActivitiesDefaults";
import RecreationalActivitiesPage from "./RecreationalActivitiesPageContent";

export default function RecreationalActivitiesPageWrapper() {
  const [recreationalActivitiesContent, setRecreationalActivitiesContent] =
    useState<RecreationalActivitiesContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getRecreationalActivitiesData();
        setRecreationalActivitiesContent(data.recreationalActivitiesContent);
      } catch (error) {
        console.error(
          "Failed to fetch recreational activities page data:",
          error
        );
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

  if (!recreationalActivitiesContent) {
    return (
      <RecreationalActivitiesPage
        recreationalActivitiesContent={defaultRecreationalActivitiesContent}
      />
    );
  }

  return (
    <RecreationalActivitiesPage
      recreationalActivitiesContent={recreationalActivitiesContent}
    />
  );
}
