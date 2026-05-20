import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, aboutPages, eq } from "../_helpers/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  try {
    await requireAdmin(req);
    const { slug } = req.query as { slug: string };
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    await db.delete(aboutPages).where(eq(aboutPages.slug, slug));
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
