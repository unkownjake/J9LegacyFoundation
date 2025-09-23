"use client";

import { useState, useEffect } from "react";
import { getFAQPageData } from "./account";
import { FAQPageContent } from "@/lib/types/faq";
import { defaultFAQPageContent } from "@/lib/defaults/faqDefaults";
import FAQPageContentComponent from "./FAQPageContent";

export default function FAQPage() {
  const [faqPageContent, setFaqPageContent] = useState<FAQPageContent | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getFAQPageData();
        setFaqPageContent(data.faqPageContent);
      } catch (error) {
        console.error("Failed to fetch FAQ page data:", error);
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

  if (!faqPageContent) {
    return <FAQPageContentComponent faqPageContent={defaultFAQPageContent} />;
  }

  return <FAQPageContentComponent faqPageContent={faqPageContent} />;
}
