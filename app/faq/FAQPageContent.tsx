"use client";

import { useState } from "react";
import { FAQPageContent } from "@/lib/types/faq";

interface FAQPageProps {
  faqPageContent: FAQPageContent;
}

export default function FAQPage({ faqPageContent }: FAQPageProps) {
  const [openFAQs, setOpenFAQs] = useState<Set<string>>(new Set());

  const toggleFAQ = (faqId: string) => {
    const newOpenFAQs = new Set(openFAQs);
    if (newOpenFAQs.has(faqId)) {
      newOpenFAQs.delete(faqId);
    } else {
      newOpenFAQs.add(faqId);
    }
    setOpenFAQs(newOpenFAQs);
  };

  // Sort FAQs by order, then by creation order
  const sortedFAQs = [...faqPageContent.faqs]
    .filter((faq) => faq.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-primary">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-accent mb-8">
          Find answers to common questions about the J9 Legacy Foundation, our
          mission, and how you can get involved.
        </p>

        {/* FAQ Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="space-y-0">
            {sortedFAQs.map((faq, index) => (
              <div
                key={faq.id}
                className={`border-b border-gray-200 ${
                  index === sortedFAQs.length - 1 ? "border-b-0" : ""
                }`}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className={`w-full px-6 py-4 text-left ${
                    openFAQs.has(faq.id)
                      ? "bg-primary-lighter"
                      : "bg-white hover:bg-gray-50"
                  } focus:outline-none transition-colors duration-200 flex justify-between items-center`}
                >
                  <span className="text-xl font-semibold text-accent">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-accent transform transition-transform duration-200 ${
                      openFAQs.has(faq.id) ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFAQs.has(faq.id) && (
                  <div className="px-6 pt-4 pb-4">
                    <div className="text-lg text-accent leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact CTA Section */}
      <section className="w-full bg-primary-lighter">
        <div className="px-4 py-16">
          <div className="max-w-screen-lg mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-accent">
              Still have questions?
            </h2>
            <p className="text-xl text-accent mb-6 font-medium">
              We're here to help! Reach out to us for any additional
              information.
            </p>
            <a
              href="mailto:info@j9legacy.org"
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-darker transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
