import { apiFetch } from "@/lib/apiFetch";
import type {
  EventPageContent,
  EventRecord,
  EventType,
} from "@/lib/types/events";

function rowToRecord(row: any): EventRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? null,
    description: row.description ?? null,
    location: row.location ?? null,
    starts_at: row.startsAt ?? row.starts_at ?? null,
    ends_at: row.endsAt ?? row.ends_at ?? null,
    hero_image: row.heroImage ?? row.hero_image ?? null,
    registration_url: row.registrationUrl ?? row.registration_url ?? null,
    published: !!row.published,
    sort_order: row.sortOrder ?? row.sort_order ?? 0,
    event_type: (row.eventType ?? row.event_type ?? "dropin") as EventType,
    cost_amount:
      (row.costAmount ?? row.cost_amount) != null
        ? Number(row.costAmount ?? row.cost_amount)
        : null,
    cost_description: row.costDescription ?? row.cost_description ?? null,
    payment_note: row.paymentNote ?? row.payment_note ?? null,
    registration_deadline:
      row.registrationDeadline ?? row.registration_deadline ?? null,
    capacity: row.capacity ?? null,
    registration_open: (row.registrationOpen ?? row.registration_open) !== false,
    recap: row.recap ?? null,
    page_content: (row.pageContent ?? row.page_content ?? {}) as EventPageContent,
    pricing_tiers: (row.pricingTiers ?? row.pricing_tiers ?? []) as EventRecord["pricing_tiers"],
    registration_form: (row.registrationForm ?? row.registration_form ?? {
      sections: [],
    }) as EventRecord["registration_form"],
    organizer_name: row.organizerName ?? row.organizer_name ?? null,
    organizer_email: row.organizerEmail ?? row.organizer_email ?? null,
    organizer_phone: row.organizerPhone ?? row.organizer_phone ?? null,
    documents: (row.documents ?? []) as EventRecord["documents"],
  };
}

export async function listPublishedEvents(): Promise<EventRecord[]> {
  const res = await fetch("/api/events");
  if (!res.ok) throw new Error("Failed to load events");
  const data = await res.json();
  return (data ?? []).map(rowToRecord);
}

export async function listAllEvents(): Promise<EventRecord[]> {
  const res = await apiFetch("/api/events?admin=1");
  if (!res.ok) throw new Error("Failed to load events");
  const data = await res.json();
  return (data ?? []).map(rowToRecord);
}

export async function getEventBySlug(slug: string): Promise<EventRecord | null> {
  const res = await fetch(`/api/events/${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return rowToRecord(data);
}

export async function createEvent(input: {
  title: string;
  slug: string;
  event_type: EventType;
}): Promise<EventRecord> {
  const res = await apiFetch("/api/events", { method: "POST", body: JSON.stringify(input) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create event");
  }
  return rowToRecord(await res.json());
}

type EventUpdate = Partial<Omit<EventRecord, "id" | "page_content">> & {
  page_content?: EventPageContent;
};

export async function updateEvent(id: string, patch: EventUpdate): Promise<void> {
  const res = await apiFetch(`/api/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update event");
  }
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await apiFetch(`/api/events/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to delete event");
  }
}

export function eventSlugFromTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `event-${Date.now()}`;
}
