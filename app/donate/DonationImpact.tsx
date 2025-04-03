import Link from "next/link";

export default function DonationImpact() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Youth Sports Programs */}
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <h3 className="text-xl font-semibold mb-4 text-accent">
          Youth Sports Programs
        </h3>
        <p className="text-gray-700 mb-4">
          Your donations help fund local youth sports programs, providing
          equipment, facilities, and coaching for underprivileged children in
          our community.
        </p>
        <Link
          href="/programs"
          className="text-primary hover:text-primary-darker font-medium inline-flex items-center"
        >
          Learn more about our programs
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      {/* Scholarship Fund */}
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <h3 className="text-xl font-semibold mb-4 text-accent">
          Scholarship Fund
        </h3>
        <p className="text-gray-700 mb-4">
          We provide scholarships to talented young athletes who need financial
          assistance to participate in competitive sports and training programs.
        </p>
        <Link
          href="/scholarships"
          className="text-primary hover:text-primary-darker font-medium inline-flex items-center"
        >
          View scholarship opportunities
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      {/* Community Events */}
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <h3 className="text-xl font-semibold mb-4 text-accent">
          Community Events
        </h3>
        <p className="text-gray-700 mb-4">
          Your support helps us organize and host community sports events,
          bringing people together and promoting healthy, active lifestyles.
        </p>
        <Link
          href="/events"
          className="text-primary hover:text-primary-darker font-medium inline-flex items-center"
        >
          See upcoming events
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      {/* Success Stories */}
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <h3 className="text-xl font-semibold mb-4 text-accent">
          Success Stories
        </h3>
        <p className="text-gray-700 mb-4">
          Meet the young athletes whose lives have been transformed through our
          programs and your generous support.
        </p>
        <Link
          href="/stories"
          className="text-primary hover:text-primary-darker font-medium inline-flex items-center"
        >
          Read their stories
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
