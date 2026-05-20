import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, events, eventSubmissions, eq, and } from "./_helpers/db";
import { sendTransactional } from "./_helpers/email";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const json = (b: unknown, status = 200) => res.status(status).json(b);

  try {
    const body = req.body as {
      action?: "get" | "cancel";
      submissionId?: string;
      magicToken?: string;
    };

    if (!body.submissionId || !body.magicToken) return json({ error: "Missing fields" }, 400);

    const subRows = await db
      .select({
        id: eventSubmissions.id,
        eventId: eventSubmissions.eventId,
        status: eventSubmissions.status,
        pricingTierName: eventSubmissions.pricingTierName,
        pricingTierKind: eventSubmissions.pricingTierKind,
        amount: eventSubmissions.amount,
        paymentMethod: eventSubmissions.paymentMethod,
        paymentStatus: eventSubmissions.paymentStatus,
        submitterName: eventSubmissions.submitterName,
        submitterEmail: eventSubmissions.submitterEmail,
        submitterPhone: eventSubmissions.submitterPhone,
        headcount: eventSubmissions.headcount,
        teamName: eventSubmissions.teamName,
        roster: eventSubmissions.roster,
        answers: eventSubmissions.answers,
        createdAt: eventSubmissions.createdAt,
        cancelledAt: eventSubmissions.cancelledAt,
      })
      .from(eventSubmissions)
      .where(and(
        eq(eventSubmissions.id, body.submissionId),
        eq(eventSubmissions.magicToken, body.magicToken),
      ))
      .limit(1);

    if (subRows.length === 0) return json({ error: "Not found" }, 404);
    const sub = subRows[0];

    const evRows = await db
      .select({
        id: events.id,
        slug: events.slug,
        title: events.title,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
        location: events.location,
        eventType: events.eventType,
      })
      .from(events)
      .where(eq(events.id, sub.eventId))
      .limit(1);

    const event = evRows[0] ?? null;

    if (body.action === "cancel") {
      if (sub.status === "cancelled") return json({ ok: true, submission: sub, event });

      const updated = await db
        .update(eventSubmissions)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(eventSubmissions.id, sub.id))
        .returning();

      await sendTransactional(sub.submitterEmail, "event_cancelled", {
        submitterName: sub.submitterName,
        eventTitle: event?.title ?? "the event",
        eventType: event?.eventType ?? "registration",
      }, { notifyType: "event_submissions" });

      return json({ ok: true, submission: updated[0], event });
    }

    return json({ ok: true, submission: sub, event });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}
