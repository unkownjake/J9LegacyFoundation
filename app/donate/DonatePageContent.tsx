import DonationWorkflow from "./donationWorkflow";
import { DonatePageContent } from "@/lib/types/donate";

interface DonatePageProps {
  donatePageContent: DonatePageContent;
}

export default function DonatePage({ donatePageContent }: DonatePageProps) {
  return (
    <div className="bg-secondary">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-primary">
          {donatePageContent.title}
        </h1>
        <p className="text-lg text-accent mb-12">
          {donatePageContent.subtitle}
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-6 mx-auto">
          <DonationWorkflow />
          <div className="bg-white p-6 rounded-xl shadow-lg border max-w-3xl md:w-1/2">
            <h2 className="text-2xl font-bold mb-8 text-primary-darker text-center">
              {donatePageContent.impactTitle}
            </h2>
            <div className="text-lg text-accent whitespace-pre-line">
              {donatePageContent.impactText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
