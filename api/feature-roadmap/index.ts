import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, featureRoadmap } from "../_helpers/db";
import { asc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    // Public read — roadmap is non-sensitive
    const rows = await db
      .select()
      .from(featureRoadmap)
      .orderBy(asc(featureRoadmap.sortOrder), asc(featureRoadmap.createdAt));
    return res.json(rows);
  }

  if (req.method === "POST") {
    try {
      await requireAdmin(req);
      const body = req.body as Record<string, unknown>;
      const inserted = await db
        .insert(featureRoadmap)
        .values({
          title: String(body.title ?? ""),
          description: body.description ? String(body.description) : null,
          category: String(body.category ?? "general"),
          priority: String(body.priority ?? "medium"),
          status: String(body.status ?? "planned"),
          notes: body.notes ? String(body.notes) : null,
          sortOrder: Number(body.sort_order ?? body.sortOrder ?? 0),
        })
        .returning();
      return res.status(201).json(inserted[0]);
    } catch (e: any) {
      return res.status(e.status ?? 500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
