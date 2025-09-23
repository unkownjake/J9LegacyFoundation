"use client";

import { useState, useEffect } from "react";
import { getCommunityEventsData } from "./account";
import { CommunityEventsContent } from "@/lib/types/communityEvents";
import { defaultCommunityEventsContent } from "@/lib/defaults/communityEventsDefaults";
import CommunityEventsPage from "./CommunityEventsPageContent";

export default function CommunityEventsPageWrapper() {
  const [communityEventsContent, setCommunityEventsContent] =
    useState<CommunityEventsContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCommunityEventsData();
        setCommunityEventsContent(data.communityEventsContent);
      } catch (error) {
        console.error("Failed to fetch community events page data:", error);
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

  if (!communityEventsContent) {
    return (
      <CommunityEventsPage
        communityEventsContent={defaultCommunityEventsContent}
      />
    );
  }

  return (
    <CommunityEventsPage communityEventsContent={communityEventsContent} />
  );
}
