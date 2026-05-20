import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, events, eventSubmissions, eq, and } from "./_helpers/db";
import { ne, count, sql } from "drizzle-orm";
import { sendTransactional } from "./_helpers/email";
import { randomUUID } from "crypto";

async function getPaypalToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Missing PayPal credentials");
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

function formatWhen(starts: Date | null, ends: Date | null): string {
  if (!starts) return "";
  try {
    const opts: Intl.DateTimeFormatOptions = {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", timeZoneName: "short",
    };
    let out = starts.toLocaleString("en-US", opts);
    if (ends) {
      out += ` – ${ends.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
    return out;
  } catch {
    return starts.toISOString();
  }
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const json = (b: unknown, status = 200) => res.status(status).json(b);

  try {
    const body = req.body as {
      eventId?: string;
      pricingTierId?: string | null;
      paymentMethod?: "free" | "in_person" | "paypal";
      submitterName?: string;
      submitterEmail?: string;
      submitterPhone?: string;
      teamName?: string;
      roster?: { name?: string; email?: string; phone?: string; notes?: string }[];
      headcount?: number;
      answers?: Record<string, unknown>;
      siteOrigin?: string;
    };

    if (!body.eventId) return json({ error: "Missing eventId" }, 400);
    const name = (body.submitterName ?? "").trim();
    const email = (body.submitterEmail ?? "").trim();
    if (name.length < 1 || name.length > 200) return json({ error: "Invalid name" }, 400);
    if (!isEmail(email) || email.length > 320) return json({ error: "Invalid email" }, 400);

    const eventRows = await db
      .select({
        id: events.id,
        slug: events.slug,
        title: events.title,
        eventType: events.eventType,
        registrationOpen: events.registrationOpen,
        pricingTiers: events.pricingTiers,
        costAmount: events.costAmount,
        capacity: events.capacity,
        published: events.published,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
        location: events.location,
      })
      .from(events)
      .where(eq(events.id, body.eventId))
      .limit(1);

    if (eventRows.length === 0) return json({ error: "Event not found" }, 404);
    const event = eventRows[0];
    if (!event.published) return json({ error: "Event not available" }, 400);
    if (!event.registrationOpen) return json({ error: "Registration is closed" }, 400);
    if (event.eventType === "dropin") return json({ error: "Drop-in events do not require submission" }, 400);

    const tiers = Array.isArray(event.pricingTiers) ? (event.pricingTiers as any[]) : [];
    let tier: any = null;
    if (event.eventType === "registration" && tiers.length > 0) {
      tier = tiers.find((t: any) => t.id === body.pricingTierId);
      if (!tier) return json({ error: "Invalid pricing tier" }, 400);
    }
    const amount = tier ? Number(tier.price) || 0 : Number(event.costAmount) || 0;

    if (event.capacity) {
      const countRows = await db
        .select({ cnt: sql<number>`count(*)::int` })
        .from(eventSubmissions)
        .where(and(eq(eventSubmissions.eventId, event.id), ne(eventSubmissions.status, "cancelled")));
      const existing = Number(countRows[0]?.cnt ?? 0);
      if (existing >= event.capacity) return json({ error: "This event is full" }, 400);
    }

    let paymentMethod: "free" | "in_person" | "paypal" = "free";
    let paymentStatus = "not_required";
    if (amount > 0) {
      paymentMethod = body.paymentMethod === "paypal" ? "paypal" : "in_person";
      paymentStatus = paymentMethod === "paypal" ? "pending" : "owed_in_person";
    }

    const status = paymentMethod === "paypal" ? "pending" : "confirmed";

    const roster = Array.isArray(body.roster) ? body.roster.slice(0, 100) : [];
    if (tier?.kind === "team") {
      const min = Number(tier.rosterMin) || 0;
      const max = Number(tier.rosterMax) || 0;
      if (min && roster.length < min) return json({ error: `Roster needs at least ${min} players` }, 400);
      if (max && roster.length > max) return json({ error: `Roster can have at most ${max} players` }, 400);
    }

    let paypalOrderId: string | null = null;
    if (paymentMethod === "paypal") {
      const token = await getPaypalToken();
      const orderRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            description: (tier?.name ?? "Event registration").slice(0, 127),
            amount: { currency_code: "USD", value: amount.toFixed(2) },
          }],
          application_context: {
            brand_name: "J9 Legacy Foundation",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
          },
        }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) return json({ error: "PayPal order failed", detail: order }, 500);
      paypalOrderId = order.id;
    }

    const headcount = Math.max(1, Math.floor(Number(body.headcount) || 1));
    const magicToken = randomUUID();

    const inserted = await db
      .insert(eventSubmissions)
      .values({
        eventId: event.id,
        status,
        pricingTierId: tier?.id ?? null,
        pricingTierName: tier?.name ?? null,
        pricingTierKind: tier?.kind ?? null,
        amount: amount.toString(),
        paymentMethod,
        paymentStatus,
        paypalOrderId,
        submitterName: name,
        submitterEmail: email,
        submitterPhone: body.submitterPhone?.trim() || null,
        teamName: body.teamName?.trim() || null,
        roster,
        headcount,
        answers: body.answers ?? {},
        magicToken,
      })
      .returning({ id: eventSubmissions.id, magicToken: eventSubmissions.magicToken });

    if (!inserted[0]) return json({ error: "Insert failed" }, 500);
    const { id: submissionId, magicToken: tok } = inserted[0];

    if (paymentMethod !== "paypal") {
      const origin = (body.siteOrigin || "https://j9legacy.org").replace(/\/$/, "");
      const manageUrl = `${origin}/events/${event.slug}/manage?id=${submissionId}&token=${tok}`;
      await sendTransactional(email, "event_confirmation", {
        submitterName: name,
        eventTitle: event.title,
        eventType: event.eventType,
        eventWhen: formatWhen(event.startsAt, event.endsAt),
        eventWhere: event.location ?? "",
        headcount,
        amount,
        paymentMethod,
        manageUrl,
      }, { notifyType: "event_submissions" });
    }

    return json({
      ok: true,
      submissionId,
      magicToken: tok,
      paypalOrderId,
      amount,
      paymentMethod,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}
