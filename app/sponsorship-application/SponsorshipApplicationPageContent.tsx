import Link from "next/link";
import { Mail, AlertCircle, CheckCircle, Tent } from "lucide-react";
import { SponsorshipApplicationContent } from "@/lib/types/sponsorshipApplication";

interface SponsorshipApplicationPageProps {
  sponsorshipApplicationContent: SponsorshipApplicationContent;
}

export default function SponsorshipApplicationPage({
  sponsorshipApplicationContent,
}: SponsorshipApplicationPageProps) {
  return (
    <div className="bg-secondary">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}

        <div className="flex flex-col mb-8">
          <div className="flex items-center mb-8">
            <Tent className="text-primary mr-4 h-12 w-12" />
            <h1 className="text-primary text-4xl font-bold">
              {sponsorshipApplicationContent.title}
            </h1>
          </div>
          <p className="text-xl text-accent">
            {sponsorshipApplicationContent.subtitle}
          </p>
        </div>

        {/* Application Process Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - How to Apply */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl text-accent font-semibold mb-4 flex items-center">
              <Mail className="text-primary mr-3 h-6 w-6" />
              {sponsorshipApplicationContent.applicationHeader}
            </h2>
            <p className="text-lg text-accent mb-6">
              {sponsorshipApplicationContent.applicationDescription}
            </p>

            {/* Application Requirements */}
            <div className="space-y-3">
              {sponsorshipApplicationContent.applicationRequirements.map(
                (requirement, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="text-green-500 mt-1 h-5 w-5 flex-shrink-0" />
                    <p className="text-accent">{requirement.text}</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right Column - Important Information */}
          <div className="space-y-6 flex flex-col">
            <div className="bg-white rounded-lg shadow-lg p-6 flex-1">
              <h2 className="text-2xl text-accent font-semibold mb-6 flex items-center">
                <AlertCircle className="text-orange-500 mr-3 h-6 w-6" />
                {sponsorshipApplicationContent.importantInfoHeader}
              </h2>

              <div className="space-y-4">
                {sponsorshipApplicationContent.importantInfoItems.map(
                  (item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-accent">{item.text}</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Sponsorship Limit */}
            <div className="bg-primary-lighter rounded-lg p-6">
              <p className="text-accent font-semibold text-lg text-center">
                {sponsorshipApplicationContent.sponsorshipLimit}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link
            href={sponsorshipApplicationContent.ctaLink}
            className="inline-flex items-center px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-darker transition-colors text-lg"
          >
            {sponsorshipApplicationContent.ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
}
