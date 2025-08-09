"use client";

import { useState } from "react";

export default function FAQPage() {
  const [openFAQs, setOpenFAQs] = useState<Set<string>>(new Set());

  const faqs = [
    {
      id: "why-started",
      question: "Why was the J9 Legacy Foundation started?",
      answer:
        "The foundation was created to honor the memory of Jacob Eshenbaugh, a beloved son, brother, cousin, and friend who passed away on May 23, 2024. Summer camps played a meaningful role in Jacob's life, and we aim to help children experience the same joy and growth they brought him.",
    },
    {
      id: "what-is-foundation",
      question: "What is the J9 Legacy Foundation?",
      answer:
        "We empower youth and families by providing financial support for camp attendance and hosting community events that promote education, recreation, and personal growth. Our mission is to ensure every child has the opportunity to learn, explore, and thrive in a nurturing environment.",
    },
    {
      id: "name-origin",
      question: "Where does the name J9 Legacy come from?",
      answer:
        '"J" represents Jacob, "9" was his lacrosse number and favorite number, and "Legacy" reflects our mission to continue his kindness and impact.',
    },
    {
      id: "who-supported",
      question: "Who does the foundation support?",
      answer:
        'We support youth and families through:\n\nCamp sponsorships, currently including:\n• Lacrosse Camps\n• Adoption Family Camp\n• Roller Skating Camp\n• Summer Fun Camp\n\nCommunity events, such as:\n• The annual "Unknown Jake Lacrosse Jamboree"\n• The yearly "Rollin\' with Jacob Skate Fundraiser"\n• Pop-up events at local restaurants and bakeries',
    },
    {
      id: "scholarship-application",
      question: "How do I apply for a camp scholarship?",
      answer:
        "Email info@j9legacy.org with the following details:\n• Camp name you're requesting a scholarship for\n• Camp dates\n• Camp cost and the amount you're requesting (up to $500 per camp per youth/family per year)\n• Your contact information\n• Name and grade of the youth(s) attending",
    },
    {
      id: "upcoming-events",
      question:
        "Where can I find information about upcoming J9 Legacy Foundation events?",
      answer:
        "Visit our website (https://www.j9legacy.org/), follow us on Facebook (J9 Legacy Foundation), or check out our Instagram (@J9_Legacy) for updates.",
    },
    {
      id: "how-to-donate",
      question: "How can I donate to the J9 Legacy Foundation?",
      answer:
        'Donations can be made via:\n• PayPal username: J9 Legacy Foundation\n• Venmo username: J9 Legacy Foundation\n• Zelle username: J9 Legacy Foundation\n• Checks made out to "J9 Legacy Foundation"',
    },
    {
      id: "tshirt-cost",
      question: "How much does a T-shirt cost?",
      answer: "[Insert price]",
    },
    {
      id: "sticker-cost",
      question: "How much does a sticker cost?",
      answer: "[Insert price]",
    },
  ];

  const toggleFAQ = (id: string) => {
    setOpenFAQs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className={`border-b border-gray-200 ${
                  index === faqs.length - 1 ? "border-b-0" : ""
                }`}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className={`w-full px-6 py-4 text-left ${
                    openFAQs.has(faq.id)
                      ? "bg-primary-lighter"
                      : "bg-white hover:bg-gray-50"
                  } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset transition-colors duration-200 flex justify-between items-center`}
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
            <h2 className="text-3xl font-bold mb-4 text-primary">
              Still have questions?
            </h2>
            <p className="text-xl text-primary-darker mb-6 font-medium">
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
