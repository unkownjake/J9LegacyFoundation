import Image from "next/image";
import Link from "next/link";
import { Tent, ArrowLeft, ExternalLink, ArrowRight } from "lucide-react";
import { CampSponsorshipContent } from "@/lib/types/campSponsorship";

interface CampSponsorshipPageProps {
  campSponsorshipContent: CampSponsorshipContent;
}

export default function CampSponsorshipPage({
  campSponsorshipContent,
}: CampSponsorshipPageProps) {
  return (
    <div className="bg-secondary">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            href="/about"
            className="inline-flex items-center text-primary hover:text-primary-darker transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to About
          </Link>
        </div>

        {/* Header Section */}
        <div className="flex items-center mb-8">
          <Tent className="text-primary mr-4 h-12 w-12" />
          <h1 className="text-primary text-4xl font-bold">
            {campSponsorshipContent.title}
          </h1>
        </div>

        {/* Content Grid with Image A */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="lg:w-1/2">
            <div className="border rounded-md bg-white shadow-lg p-6 h-full">
              <h2 className="text-xl text-accent font-semibold mb-4">
                {campSponsorshipContent.infoTitle}
              </h2>
              <div className="text-lg text-accent mb-6 whitespace-pre-line">
                {campSponsorshipContent.infoText}
              </div>
            </div>
          </div>
          <div className="relative lg:w-1/2 w-full lg:aspect-[16/9] aspect-[4/3] rounded-md shadow-lg overflow-hidden">
            <Image
              src={campSponsorshipContent.imageA}
              alt="Camp Sponsorship Hero"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Current Camp Sponsorships Section */}
        <div className="border rounded-md bg-white shadow-lg p-6 mb-6">
          <h2 className="text-xl text-accent font-semibold mb-4">
            Current Camp Sponsorships
          </h2>
          <div className="space-y-4">
            {campSponsorshipContent.campSponsorships.map(
              (sponsorship, index) => (
                <div
                  key={index}
                  className="bg-orange-100 p-4 rounded-md hover:bg-orange-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-primary">
                      {sponsorship.name}
                    </h3>
                    {sponsorship.url && (
                      <a
                        href={sponsorship.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-darker transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-accent text-sm">
                    {sponsorship.description}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
        {/* Content Grid with Image B */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="relative lg:w-2/3 w-full lg:aspect-[16/9] aspect-[4/3] rounded-md shadow-lg overflow-hidden">
            <Image
              src={campSponsorshipContent.imageB}
              alt="Camp Sponsorship Secondary"
              fill
              className="object-cover"
            />
          </div>
          <div className="lg:w-1/3">
            <div className="border rounded-md bg-white shadow-lg p-6 h-full flex flex-col items-center justify-center">
              <p className="text-lg text-accent text-center leading-relaxed whitespace-pre-line">
                {campSponsorshipContent.conclusion}
              </p>
              <Link
                href="/sponsorship-application"
                className="text-primary hover:text-primary-darker font-semibold flex flex-row items-center mt-4"
              >
                Apply for Camp Sponsorship
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
