import { CampSponsorshipContent } from "@/lib/types/campSponsorship";

export const defaultCampSponsorshipContent: CampSponsorshipContent = {
  title: "Sponsor Youth and Families to Attend Camps",
  imageA: "/sponsor1.jpeg",
  imageB: "/sponsor2.jpeg",
  infoTitle: "Why Camps Sponsorships?",
  infoText: `Summer camps played a pivotal role in Jacob's childhood, shaping experiences that remained deeply meaningful to him. The friendships, confidence-building moments, and sense of adventure that camps provided were cornerstones of his journey, leaving lasting impressions that influenced his life.
    
    To honor his legacy, the J9 Legacy Foundation is committed to ensuring that youth and families, regardless of financial barriers, have access to these transformative experiences. Through camp sponsorships, our goal is to help young people discover new skills, build self-confidence, and form lasting friendships in an environment that fosters growth and joy.`,
  campSponsorships: [
    {
      name: "Lacrosse Camp",
      description:
        "Sponsoring a ninth-grade girl to attend a weeklong goalie lacrosse camp, providing her with specialized coaching and a chance to build skills, resilience, and teamwork in a sport Jacob loved.",
    },
    {
      name: "Adoption Family Camp",
      description:
        "Partnering with organizations to identify families in need of scholarships, ensuring that adopted children and their families can attend a camp designed to support connection, growth, and shared experiences.",
      url: "https://www.adoptionfamilycamp.org/",
    },
    {
      name: "Roller Skating Camp",
      description:
        "Working with organizations to help youth access roller skating camp, where they can experience the freedom and joy of movement while building confidence in a supportive environment.",
    },
    {
      name: "Summer Fun Camp",
      description:
        "Sponsoring two youth for a weeklong summer camp experience, where they can explore new activities, make lifelong friends, and enjoy the simple pleasures of summer adventures.",
      url: "https://www.summerfuncamp.net/",
    },
  ],
  conclusion:
    "Beyond the activities themselves, these camps give youth and families moments of joy, personal development, and belonging, ensuring that Jacob's legacy lives on through each shared experience, each new friendship, and each spark of confidence gained along the way.",
};
