import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, donations, eq } from "../_helpers/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  try {
    await requireAdmin(req);
    const { id } = req.query as { id: string };
    if (!id) return res.status(400).json({ error: "Missing id" });

    const body = req.body as Record<string, unknown>;
    const allowed = ["thanked_at", "notes"] as const;
    const patch: Record<string, unknown> = { updatedAt: new Date() };

    if ("thanked_at" in body) patch.thankedAt = body.thanked_at ? new Date(body.thanked_at as string) : null;
    if ("notes" in body) patch.notes = body.notes;

    await db.update(donations).set(patch as never).where(eq(donations.id, id));
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
