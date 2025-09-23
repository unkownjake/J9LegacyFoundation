"use client";

import { useState, useEffect } from "react";
import { getSponsorshipApplicationData } from "./account";
import { SponsorshipApplicationContent } from "@/lib/types/sponsorshipApplication";
import { defaultSponsorshipApplicationContent } from "@/lib/defaults/sponsorshipApplicationDefaults";
import SponsorshipApplicationPage from "./SponsorshipApplicationPageContent";

export default function SponsorshipApplicationPageWrapper() {
  const [sponsorshipApplicationContent, setSponsorshipApplicationContent] =
    useState<SponsorshipApplicationContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSponsorshipApplicationData();
        setSponsorshipApplicationContent(data.sponsorshipApplicationContent);
      } catch (error) {
        console.error(
          "Failed to fetch sponsorship application page data:",
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

  if (!sponsorshipApplicationContent) {
    return (
      <SponsorshipApplicationPage
        sponsorshipApplicationContent={defaultSponsorshipApplicationContent}
      />
    );
  }

  return (
    <SponsorshipApplicationPage
      sponsorshipApplicationContent={sponsorshipApplicationContent}
    />
  );
}
