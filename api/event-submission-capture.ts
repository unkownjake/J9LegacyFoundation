import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, events, eventSubmissions, eq, and } from "./_helpers/db";
import { sendTransactional } from "./_helpers/email";

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
    let out = starts.toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", timeZoneName: "short",
    });
    if (ends) {
      out += ` – ${ends.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
    return out;
  } catch {
    return starts.toISOString();
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const json = (b: unknown, status = 200) => res.status(status).json(b);

  try {
    const body = req.body as {
      submissionId?: string;
      magicToken?: string;
      orderId?: string;
      siteOrigin?: string;
    };

    if (!body.submissionId || !body.magicToken || !body.orderId) {
      return json({ error: "Missing fields" }, 400);
    }
    const subRows = await db
      .select()
      .from(eventSubmissions)
      .where(and(
        eq(eventSubmissions.id, body.submissionId),
        eq(eventSubmissions.magicToken, body.magicToken),
      ))
      .limit(1);

    if (subRows.length === 0) return json({ error: "Submission not found" }, 404);
    const sub = subRows[0];
    if (sub.paypalOrderId !== body.orderId) return json({ error: "Order mismatch" }, 400);

    const token = await getPaypalToken();
    const capRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${body.orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const capture = await capRes.json();
    if (!capRes.ok) return json({ error: "Capture failed", detail: capture }, 500);
    const cap = capture.purchase_units?.[0]?.payments?.captures?.[0];

    await db
      .update(eventSubmissions)
      .set({
        status: "confirmed",
        paymentStatus: cap?.status === "COMPLETED" ? "paid" : "pending",
        paypalCaptureId: cap?.id ?? null,
      })
      .where(eq(eventSubmissions.id, sub.id));

    const evRows = await db
      .select({
        slug: events.slug,
        title: events.title,
        eventType: events.eventType,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
        location: events.location,
      })
      .from(events)
      .where(eq(events.id, sub.eventId))
      .limit(1);

    if (evRows.length > 0) {
      const ev = evRows[0];
      const origin = (body.siteOrigin || "https://j9legacy.org").replace(/\/$/, "");
      const manageUrl = `${origin}/events/${ev.slug}/manage?id=${sub.id}&token=${body.magicToken}`;
      await sendTransactional(sub.submitterEmail, "event_confirmation", {
        submitterName: sub.submitterName,
        eventTitle: ev.title,
        eventType: ev.eventType,
        eventWhen: formatWhen(ev.startsAt, ev.endsAt),
        eventWhere: ev.location ?? "",
        headcount: sub.headcount ?? 1,
        amount: sub.amount,
        paymentMethod: "paypal",
        manageUrl,
      }, { notifyType: "event_submissions" });
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}
