"use client";
import Link from "next/link";
import DonationWorkflow from "./donationWorkflow";

export default function DonatePage() {
  return (
    <div className="bg-secondary">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-primary">
          Support Our Cause
        </h1>
        <p className="text-lg text-accent mb-12">
          Your donation helps us continue our mission to support youth
          athletics. Every contribution, no matter the size, makes a difference.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-6 mx-auto">
          <DonationWorkflow />
          <div className="bg-white p-6 rounded-xl shadow-lg border max-w-3xl md:w-1/2">
            <h2 className="text-2xl font-bold mb-8 text-primary-darker text-center">
              Building Our Impact
            </h2>
            <p className="text-lg text-accent mb-6">
              We are currently in the process of identifying and establishing
              partnerships with youth sports programs and organizations in the
              greater Seattle area that align with our mission. Your donations
              will help us support these initiatives once they are finalized.
            </p>
            <p className="text-lg text-accent">
              We are committed to transparency and will keep our donors informed
              as we develop our programs and partnerships. Thank you for your
              support as we work to make a meaningful impact in our local
              community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
