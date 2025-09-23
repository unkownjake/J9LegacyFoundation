import { AboutPageContent } from "@/lib/types/about";

export const defaultAboutPageContent: AboutPageContent = {
  title: "About J9 Legacy Foundation",
  missionSectionText: `The J9 Legacy Foundation was started to honor the memory of our son, brother, cousin, and friend, Jacob Eshenbaugh, who passed away on May 23, 2024. As a child, summer camps were an important and impactful part of Jacob's life, so we thought it was fitting to try and help children experience something that was so meaningful to him.

The Foundation is dedicated to empowering youth and families by providing financial support for camp attendance and organizing community events that enhance access to educational and recreational opportunities. We believe that every child deserves the chance to grow, learn, and explore in a nurturing and supportive environment.

Through our efforts, we honor Jacob's legacy by opening doors to opportunities that create cherished memories for children in need. Together, we strive to transform lives and make a lasting impact, one experience at a time.`,
  image: "/j9.png",
  impactHeader: "Our Impact",
  impactSubheader: "Through our initiatives, we aim to:",
  impactCards: [
    {
      icon: "tent",
      text: "Sponsor youth and families to attend camps",
      link: "/about/camp-sponsorship",
    },
    {
      icon: "users",
      text: "Host community events supporting educational access",
      link: "/about/community-events",
    },
    {
      icon: "volleyball",
      text: "Create opportunities for recreational activities",
      link: "/about/recreational-activities",
    },
    {
      icon: "rainbow",
      text: "Foster personal growth and development",
      link: "/about/personal-growth",
    },
  ],
  impactFooter:
    "Join us in our mission to create lasting positive impacts on the lives of youth and families in our community.",
};
