import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { PersonalGrowthContent } from "@/lib/types/personalGrowth";

interface PersonalGrowthPageProps {
  personalGrowthContent: PersonalGrowthContent;
}

export default function PersonalGrowthPage({
  personalGrowthContent,
}: PersonalGrowthPageProps) {
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
            {personalGrowthContent.title}
          </h1>
        </div>

        {/* Intro Text Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
          <p className="text-lg text-accent leading-relaxed max-w-4xl mx-auto">
            {personalGrowthContent.introText}
          </p>
        </div>

        {/* Content Grid with Image */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="lg:w-1/2">
            <div className="space-y-6">
              {/* Building Confidence Section */}
              <div className="border rounded-md bg-white shadow-lg p-6 h-full">
                <h2 className="text-xl text-accent font-semibold mb-4">
                  {personalGrowthContent.confidenceHeader}
                </h2>
                <p className="text-accent leading-relaxed">
                  {personalGrowthContent.confidenceText}
                </p>
              </div>

              {/* Friendship Section */}
              <div className="border rounded-md bg-white shadow-lg p-6 h-full">
                <h2 className="text-xl text-accent font-semibold mb-4">
                  {personalGrowthContent.friendshipHeader}
                </h2>
                <p className="text-accent leading-relaxed">
                  {personalGrowthContent.friendshipText}
                </p>
              </div>

              {/* Joy Section */}
              <div className="border rounded-md bg-white shadow-lg p-6 h-full">
                <h2 className="text-xl text-accent font-semibold mb-4">
                  {personalGrowthContent.joyHeader}
                </h2>
                <p className="text-accent leading-relaxed">
                  {personalGrowthContent.joyText}
                </p>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="relative lg:w-1/2 w-full lg:aspect-[16/9] aspect-[4/3] rounded-md shadow-lg overflow-hidden">
            <Image
              src={personalGrowthContent.image}
              alt="Personal Growth"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Conclusion Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-lg text-accent leading-relaxed max-w-4xl mx-auto">
            {personalGrowthContent.conclusion}
          </p>
        </div>
      </div>
    </div>
  );
}
