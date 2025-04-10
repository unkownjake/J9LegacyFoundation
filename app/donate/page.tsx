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
        <p className="text-lg text-gray-700 mb-8">
          Your donation helps us continue our mission to support youth
          athletics. Every contribution, no matter the size, makes a difference.
        </p>
        <DonationWorkflow />

        <section className="mt-16">
          <h2 className="text-3xl font-bold mb-8 text-primary text-center">
            Building Our Impact
          </h2>

          <div className="bg-white p-8 rounded-xl shadow-lg border max-w-3xl mx-auto">
            <p className="text-lg text-gray-700 mb-6">
              We are currently in the process of identifying and establishing
              partnerships with youth sports programs and organizations in the
              greater Seattle area that align with our mission. Your donations
              will help us support these initiatives once they are finalized.
            </p>
            <p className="text-lg text-gray-700">
              We are committed to transparency and will keep our donors informed
              as we develop our programs and partnerships. Thank you for your
              support as we work to make a meaningful impact in our local
              community.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
