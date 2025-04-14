import React from "react";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-darker mb-6">
            Thank You for Your Generous Donation!
          </h1>
          <div className="space-y-4 text-gray-600">
            <p>
              We've sent a confirmation email with your donation receipt. Your
              support means the world to us and helps us continue Jacob's
              legacy.
            </p>
            <p>
              The J9 Legacy Foundation is committed to helping youth and
              families experience the same meaningful opportunities that were so
              important to Jacob. Your contribution directly supports this
              mission.
            </p>
            <p className="text-sm">
              If you have any questions about your donation, please don't
              hesitate to contact us at{" "}
              <a
                href="mailto:nmaxey@j9legacy.org"
                className="text-accent hover:text-primary-darker"
              >
                nmaxey@j9legacy.org
              </a>
            </p>
          </div>
        </div>
        <div className="flex justify-center space-x-4 mt-8">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-accent hover:bg-primary-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            Return to Home
          </a>
          <a
            href="/about"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            Learn More About Our Mission
          </a>
        </div>
      </div>
    </div>
  );
}
