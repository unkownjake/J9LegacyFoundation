import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, donations } from "../_helpers/db";
import { desc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    await requireAdmin(req);
    const rows = await db.select().from(donations).orderBy(desc(donations.createdAt));
    return res.json(rows);
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
