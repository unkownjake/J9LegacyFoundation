import { FAQPageContent } from "@/lib/types/faq";

export const defaultFAQPageContent: FAQPageContent = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about the J9 Legacy Foundation.",
  faqs: [
    {
      id: "why-started",
      question: "Why was the J9 Legacy Foundation started?",
      answer:
        "The foundation was created to honor the memory of Jacob Eshenbaugh, a beloved son, brother, cousin, and friend who passed away on May 23, 2024. Summer camps played a meaningful role in Jacob's life, and we aim to help children experience the same joy and growth they brought him.",
      order: 1,
      isActive: true,
    },
    {
      id: "what-is-foundation",
      question: "What is the J9 Legacy Foundation?",
      answer:
        "We empower youth and families by providing financial support for camp attendance and hosting community events that promote education, recreation, and personal growth. Our mission is to ensure every child has the opportunity to learn, explore, and thrive in a nurturing environment.",
      order: 2,
      isActive: true,
    },
    {
      id: "name-origin",
      question: "Where does the name J9 Legacy come from?",
      answer:
        '"J" represents Jacob, "9" was his lacrosse number and favorite number, and "Legacy" reflects our mission to continue his kindness and impact.',
      order: 3,
      isActive: true,
    },
    {
      id: "who-supported",
      question: "Who does the foundation support?",
      answer:
        'We support youth and families through:\n\nCamp sponsorships, currently including:\n• Lacrosse Camps\n• Adoption Family Camp\n• Roller Skating Camp\n• Summer Fun Camp\n\nCommunity events, such as:\n• The annual "Unknown Jake Lacrosse Jamboree"\n• The yearly "Rollin\' with Jacob Skate Fundraiser"\n• Pop-up events at local restaurants and bakeries',
      order: 4,
      isActive: true,
    },
    {
      id: "scholarship-application",
      question: "How do I apply for a camp scholarship?",
      answer:
        "Email info@j9legacy.org with the following details:\n• Camp name you're requesting a scholarship for\n• Camp dates\n• Camp cost and the amount you're requesting (up to $500 per camp per youth/family per year)\n• Your contact information\n• Name and grade of the youth(s) attending",
      order: 5,
      isActive: true,
    },
    {
      id: "upcoming-events",
      question:
        "Where can I find information about upcoming J9 Legacy Foundation events?",
      answer:
        "Visit our website (https://www.j9legacy.org/), follow us on Facebook (J9 Legacy Foundation), or check out our Instagram (@J9_Legacy) for updates.",
      order: 6,
      isActive: true,
    },
    {
      id: "how-to-donate",
      question: "How can I donate to the J9 Legacy Foundation?",
      answer:
        'Donations can be made via:\n• PayPal username: J9 Legacy Foundation\n• Venmo username: J9 Legacy Foundation\n• Zelle username: J9 Legacy Foundation\n• Checks made out to "J9 Legacy Foundation"',
      order: 7,
      isActive: true,
    },
    {
      id: "tshirt-cost",
      question: "How much does a T-shirt cost?",
      answer: "[Insert price]",
      order: 8,
      isActive: true,
    },
    {
      id: "sticker-cost",
      question: "How much does a sticker cost?",
      answer: "[Insert price]",
      order: 9,
      isActive: true,
    },
  ],
};
