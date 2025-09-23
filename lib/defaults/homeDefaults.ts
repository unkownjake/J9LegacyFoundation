import { HomePageCardContent, HeroContent } from "@/lib/types/home";

export const defaultHeroContent: HeroContent = {
  title: "J9 Legacy Foundation",
  description:
    "Empowering youth and families to attend camps through community events that support access to educational and recreational opportunities.",
};

export const defaultHomePageCards: HomePageCardContent[] = [
  {
    id: "default-1",
    title: "About Us",
    description:
      "Learn about our mission and the impact we're making in the community.",
    icon: "info",
    link: "/about",
    image: "/family.jpg",
    verticalPosition: "center",
  },
  {
    id: "default-2",
    title: "Our Events",
    description: "Discover upcoming events and how you can get involved.",
    icon: "calendar",
    link: "/events",
    image: "/camp.JPG",
    verticalPosition: "center",
  },
  {
    id: "default-3",
    title: "Support Our Cause",
    description:
      "Find out how you can contribute to our mission and make a difference.",
    icon: "heart",
    link: "/donate",
    image: "/support_our_cause.jpg",
    verticalPosition: "20%",
  },
];

export const defaultHomePageData = {
  hero: defaultHeroContent,
  homepageCards: defaultHomePageCards,
};
