"use client";

import { useState, useEffect } from "react";
import { getDonatePageData } from "./account";
import { DonatePageContent as DonatePageContentType } from "@/lib/types/donate";
import { defaultDonatePageContent } from "@/lib/defaults/donateDefaults";
import DonatePageContent from "./DonatePageContent";

export default function DonatePage() {
  const [donatePageContent, setDonatePageContent] =
    useState<DonatePageContentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDonatePageData();
        setDonatePageContent(data.donatePageContent);
      } catch (error) {
        console.error("Failed to fetch donate page data:", error);
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

  if (!donatePageContent) {
    return <DonatePageContent donatePageContent={defaultDonatePageContent} />;
  }

  return <DonatePageContent donatePageContent={donatePageContent} />;
}
