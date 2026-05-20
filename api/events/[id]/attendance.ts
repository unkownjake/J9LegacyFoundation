import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, eventSubmissions, eq, and } from "../../_helpers/db";
import { isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query as { id: string };
  if (!id) return res.status(400).json({ error: "Missing id" });

  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventSubmissions)
    .where(
      and(
        eq(eventSubmissions.eventId, id),
        isNull(eventSubmissions.cancelledAt),
      ),
    );

  return res.json({ count: rows[0]?.count ?? 0 });
}
