import Image from "next/image";
import Link from "next/link";
import { Tent, Users, Volleyball, Rainbow } from "lucide-react";
import { AboutPageContent } from "@/lib/types/about";

interface AboutPageProps {
  aboutPageContent: AboutPageContent;
}

// Icon mapping for impact cards
const iconMap = {
  tent: Tent,
  users: Users,
  volleyball: Volleyball,
  rainbow: Rainbow,
};

export default function AboutPage({ aboutPageContent }: AboutPageProps) {
  return (
    <div className="bg-secondary">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-primary text-4xl font-bold mb-12">
          {aboutPageContent.title}
        </h1>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="lg:w-1/2">
            <div className="border rounded-md bg-white shadow-lg p-6">
              <h2 className="text-xl text-accent font-semibold mb-4">
                Our Mission
              </h2>
              <div className="text-lg text-accent mb-6 whitespace-pre-line">
                {aboutPageContent.missionSectionText}
              </div>
            </div>
          </div>
          <div className="relative lg:w-1/2 w-full lg:aspect-[16/9] aspect-[4/3] rounded-md shadow-lg overflow-hidden">
            <Image
              src={aboutPageContent.image}
              alt="J9 Legacy Foundation Team"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="border rounded-md bg-white shadow-lg p-6">
          <h2 className="text-xl text-accent font-semibold mb-4">
            {aboutPageContent.impactHeader}
          </h2>
          <p className="text-lg text-accent mb-4">
            {aboutPageContent.impactSubheader}
          </p>
          <ul className="flex flex-col lg:flex-row mx-auto gap-6 list-inside text-accent">
            {aboutPageContent.impactCards.map((card, index) => {
              const IconComponent =
                iconMap[card.icon as keyof typeof iconMap] || Tent;
              return (
                <li key={index}>
                  <Link
                    href={card.link}
                    className="block rounded-md bg-orange-100 p-4 hover:bg-orange-200 transition-colors cursor-pointer"
                  >
                    <IconComponent className="mb-1" />
                    {card.text}
                  </Link>
                </li>
              );
            })}
          </ul>
          <hr className="border-t border-secondary my-4" />

          <div className="mx-auto my-10">
            <p className="mx-auto text-xl text-accent text-center font-semibold">
              {aboutPageContent.impactFooter}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
