import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, events, eq } from "../_helpers/db";

// Converts snake_case request body keys to the Drizzle camelCase column names
function toDbPatch(body: Record<string, unknown>): Record<string, unknown> {
  const MAP: Record<string, string> = {
    title: "title",
    subtitle: "subtitle",
    description: "description",
    location: "location",
    starts_at: "startsAt",
    ends_at: "endsAt",
    hero_image: "heroImage",
    registration_url: "registrationUrl",
    published: "published",
    sort_order: "sortOrder",
    event_type: "eventType",
    cost_description: "costDescription",
    payment_note: "paymentNote",
    registration_deadline: "registrationDeadline",
    capacity: "capacity",
    registration_open: "registrationOpen",
    recap: "recap",
    page_content: "pageContent",
    pricing_tiers: "pricingTiers",
    registration_form: "registrationForm",
    cost_amount: "costAmount",
    organizer_name: "organizerName",
    organizer_email: "organizerEmail",
    organizer_phone: "organizerPhone",
    documents: "documents",
    slug: "slug",
  };
  const DATE_FIELDS = new Set(["startsAt", "endsAt"]);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    const mapped = MAP[k] ?? k;
    result[mapped] = DATE_FIELDS.has(mapped) && typeof v === "string" && v ? new Date(v) : v;
  }
  result.updatedAt = new Date();
  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string };
  if (!id) return res.status(400).json({ error: "Missing id" });

  // GET by id or slug (public)
  if (req.method === "GET") {
    // Try as slug first, then as id
    const bySlug = await db.select().from(events).where(eq(events.slug, id)).limit(1);
    if (bySlug.length > 0) return res.json(bySlug[0]);

    const byId = await db.select().from(events).where(eq(events.id, id)).limit(1);
    if (byId.length > 0) return res.json(byId[0]);

    return res.status(404).json({ error: "Not found" });
  }

  if (req.method === "PUT") {
    try {
      await requireAdmin(req);
      const patch = toDbPatch(req.body as Record<string, unknown>);
      await db.update(events).set(patch as never).where(eq(events.id, id));
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(e.status ?? 500).json({ error: e.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      await requireAdmin(req);
      await db.delete(events).where(eq(events.id, id));
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(e.status ?? 500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
