import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { RecreationalActivitiesContent } from "@/lib/types/recreationalActivities";

interface RecreationalActivitiesPageProps {
  recreationalActivitiesContent: RecreationalActivitiesContent;
}

export default function RecreationalActivitiesPage({
  recreationalActivitiesContent,
}: RecreationalActivitiesPageProps) {
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
          <Users className="text-primary mr-4 h-12 w-12" />
          <h1 className="text-primary text-4xl font-bold">
            {recreationalActivitiesContent.title}
          </h1>
        </div>

        {/* Info Text Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <p className="text-lg text-accent leading-relaxed whitespace-pre-line">
            {recreationalActivitiesContent.infoText}
          </p>
        </div>

        {/* Content Grid with Image */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="lg:w-1/2">
            <div className="border rounded-md bg-white shadow-lg p-6 h-full">
              <h2 className="text-xl text-accent font-semibold mb-4">
                {recreationalActivitiesContent.currentInitiativesHeader}
              </h2>
              <div className="space-y-6">
                {recreationalActivitiesContent.currentInitiatives.map(
                  (initiative, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <h3 className="font-semibold text-primary mb-2">
                        {initiative.name}
                      </h3>
                      <p className="text-accent text-sm leading-relaxed">
                        {initiative.description}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          <div className="relative lg:w-1/2 w-full lg:aspect-[16/9] aspect-[4/3] rounded-md shadow-lg overflow-hidden">
            <Image
              src={recreationalActivitiesContent.image}
              alt="Recreational Activities"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Future Outlook Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-lg text-accent leading-relaxed">
            {recreationalActivitiesContent.futureOutlook}
          </p>
        </div>
      </div>
    </div>
  );
}
