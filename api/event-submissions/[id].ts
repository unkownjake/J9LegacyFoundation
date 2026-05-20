import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, eventSubmissions, eq } from "../_helpers/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  try {
    await requireAdmin(req);
    const { id } = req.query as { id: string };
    if (!id) return res.status(400).json({ error: "Missing id" });

    await db.delete(eventSubmissions).where(eq(eventSubmissions.id, id));
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
