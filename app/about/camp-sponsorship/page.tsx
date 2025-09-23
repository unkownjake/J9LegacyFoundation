"use client";

import { useState, useEffect } from "react";
import { getCampSponsorshipData } from "./account";
import { CampSponsorshipContent } from "@/lib/types/campSponsorship";
import { defaultCampSponsorshipContent } from "@/lib/defaults/campSponsorshipDefaults";
import CampSponsorshipPage from "./CampSponsorshipPageContent";

export default function CampSponsorshipPageWrapper() {
  const [campSponsorshipContent, setCampSponsorshipContent] =
    useState<CampSponsorshipContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCampSponsorshipData();
        setCampSponsorshipContent(data.campSponsorshipContent);
      } catch (error) {
        console.error("Failed to fetch camp sponsorship page data:", error);
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

  if (!campSponsorshipContent) {
    return (
      <CampSponsorshipPage
        campSponsorshipContent={defaultCampSponsorshipContent}
      />
    );
  }

  return (
    <CampSponsorshipPage campSponsorshipContent={campSponsorshipContent} />
  );
}
