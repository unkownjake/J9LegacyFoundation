import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, events, eq } from "../_helpers/db";
import { desc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const adminMode = req.query.admin === "1";

    // Admin mode requires auth
    if (adminMode) {
      try {
        await requireAdmin(req);
      } catch (e: any) {
        return res.status(e.status ?? 403).json({ error: e.message });
      }
    }

    const rows = await db
      .select()
      .from(events)
      .where(adminMode ? undefined : eq(events.published, true))
      .orderBy(desc(events.startsAt));

    return res.json(rows);
  }

  if (req.method === "POST") {
    try {
      await requireAdmin(req);

      const body = req.body as {
        title?: string;
        slug?: string;
        event_type?: string;
      };

      if (!body.title || !body.slug) {
        return res.status(400).json({ error: "title and slug are required" });
      }

      const inserted = await db
        .insert(events)
        .values({
          title: body.title,
          slug: body.slug,
          eventType: body.event_type ?? "dropin",
          published: false,
        })
        .returning();

      return res.status(201).json(inserted[0]);
    } catch (e: any) {
      if (e.message?.includes("unique") || e.message?.includes("duplicate")) {
        return res.status(409).json({ error: "Slug already exists" });
      }
      return res.status(e.status ?? 500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
