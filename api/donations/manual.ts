import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, donations } from "../_helpers/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await requireAdmin(req);

    const body = req.body as {
      source?: string;
      environment?: string;
      donor_name?: string | null;
      donor_email?: string | null;
      amount?: number;
      net_amount?: number;
      status?: string;
      captured_at?: string;
      notes?: string | null;
    };

    const amt = Number(body.amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: "Invalid amount" });

    const inserted = await db
      .insert(donations)
      .values({
        source: body.source ?? "manual",
        environment: body.environment ?? "live",
        donorName: body.donor_name ?? null,
        donorEmail: body.donor_email ?? null,
        amount: amt.toString(),
        netAmount: (body.net_amount ?? amt).toString(),
        status: body.status ?? "completed",
        capturedAt: body.captured_at ? new Date(body.captured_at) : new Date(),
        notes: body.notes ?? null,
      })
      .returning({ id: donations.id });

    return res.status(201).json({ ok: true, id: inserted[0]?.id });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
