import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, donations, eq } from "./_helpers/db";
import { sendTransactional } from "./_helpers/email";

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const json = (b: unknown, status = 200) => res.status(status).json(b);

  try {
    const body = req.body as {
      donationId?: string;
      donorName?: string;
      donorEmail?: string;
    };

    const name = (body.donorName ?? "").trim();
    const email = (body.donorEmail ?? "").trim();
    if (!body.donationId || !name || !email || !isEmail(email)) {
      return json({ error: "Invalid name, email, or donation id" }, 400);
    }

    const rows = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        feesCovered: donations.feesCovered,
        thankedAt: donations.thankedAt,
      })
      .from(donations)
      .where(eq(donations.id, body.donationId))
      .limit(1);

    if (rows.length === 0) return json({ error: "Donation not found" }, 404);
    const donation = rows[0];
    if (donation.thankedAt) return json({ ok: true, alreadySent: true });

    await db
      .update(donations)
      .set({ donorName: name, donorEmail: email })
      .where(eq(donations.id, body.donationId));

    await sendTransactional(email, "donation_receipt", {
      donorName: name,
      amount: donation.amount,
      feesCovered: donation.feesCovered ?? 0,
    }, { notifyType: "donations" });

    await db
      .update(donations)
      .set({ thankedAt: new Date() })
      .where(eq(donations.id, body.donationId));

    return json({ ok: true });
  } catch (e) {
    console.error("donation-receipt error:", e);
    return json({ error: (e as Error).message }, 500);
  }
}
