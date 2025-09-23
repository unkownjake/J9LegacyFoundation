import { SponsorshipApplicationContent } from "@/lib/types/sponsorshipApplication";

export const defaultSponsorshipApplicationContent: SponsorshipApplicationContent =
  {
    title: "Apply for Camp Sponsorship",
    subtitle:
      "Financial support for youth and families to attend transformative camp experiences",
    applicationHeader: "How to Apply",
    applicationDescription:
      "Applying for camp sponsorship is simple. Email us at info@j9legacy.org with the following information:",
    applicationRequirements: [
      { text: "Camp name you're requesting sponsorship for" },
      { text: "Camp dates" },
      { text: "Total camp cost and amount you're requesting" },
      { text: "Your contact information" },
      { text: "Name and grade of the youth(s) attending" },
      {
        text: "Tell us your story - Help us understand your family's situation and why this camp experience would be meaningful",
      },
    ],
    sponsorshipLimit:
      "Sponsorship Limit: Up to $500 per camp per youth/family per year",
    importantInfoHeader: "Important Application Information:",
    importantInfoItems: [
      {
        text: "We have limited resources and cannot support every application",
      },
      { text: "Applications are reviewed within 2 weeks of submission" },
      { text: "We will contact you with our decision via email" },
      {
        text: "Please apply as early as possible before camp registration deadlines",
      },
    ],
    ctaText: "Support Our Camp Sponsorship Program",
    ctaLink: "/donate",
  };
