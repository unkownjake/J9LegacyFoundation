import type { PricingTier, RegistrationForm } from "@/lib/types/registration";
import type { DocumentItem } from "@/lib/types/cms";

export type EventType = "registration" | "rsvp" | "dropin";

export interface EventPageContent {
  /** Label of the back link at the top of the page. */
  backLabel?: string;
  /** Badge text shown above the title for past events. */
  pastBadge?: string;
  /** Badge text shown above the title for upcoming events. */
  upcomingBadge?: string;
  /** Badge text shown above the title for in-progress events. */
  inProgressBadge?: string;
  /** Heading for the recap card on past events. */
  recapHeading?: string;
  /** Label for the registration deadline row. */
  deadlineLabel?: string;
  /** Label for the cost row. */
  costLabel?: string;
  /** Label of the registration / RSVP CTA button. */
  registerCta?: string;
  rsvpCta?: string;
}

export const defaultEventPageContent: Required<EventPageContent> = {
  backLabel: "Back to Events",
  pastBadge: "Past Event",
  upcomingBadge: "Upcoming Event",
  inProgressBadge: "Happening Now",
  recapHeading: "Event Recap",
  deadlineLabel: "Registration Deadline:",
  costLabel: "Cost:",
  registerCta: "Register Now",
  rsvpCta: "RSVP",
};

export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  hero_image: string | null;
  registration_url: string | null;
  published: boolean;
  sort_order: number;
  event_type: EventType;
  cost_amount: number | null;
  cost_description: string | null;
  payment_note: string | null;
  registration_deadline: string | null;
  capacity: number | null;
  registration_open: boolean;
  recap: string | null;
  page_content: EventPageContent;
  pricing_tiers: PricingTier[];
  registration_form: RegistrationForm;
  organizer_name: string | null;
  organizer_email: string | null;
  organizer_phone: string | null;
  documents: DocumentItem[];
}

export interface EventsPageContent {
  title: string;
  intro: string;
  upcomingHeading: string;
  pastHeading: string;
  inProgress: {
    badge: string;
    title: string;
    intro: string;
  };
  empty: {
    title: string;
    intro: string;
  };
}

export const emptyEventsPageContent: EventsPageContent = {
  title: "Community Events & Activities",
  intro: "",
  upcomingHeading: "Upcoming Events",
  pastHeading: "Past Events",
  inProgress: {
    badge: "Happening Now",
    title: "An event is happening right now!",
    intro: "Come join us — the event is in progress.",
  },
  empty: {
    title: "No events scheduled right now",
    intro: "Check back soon for upcoming community events.",
  },
};

export type EventStatus = "in-progress" | "upcoming" | "past";

export function getEventStatus(e: EventRecord, now = new Date()): EventStatus {
  const start = e.starts_at ? new Date(e.starts_at) : null;
  const end = e.ends_at ? new Date(e.ends_at) : start;
  if (start && end && start <= now && end >= now) return "in-progress";
  if (start && start > now) return "upcoming";
  return "past";
}
