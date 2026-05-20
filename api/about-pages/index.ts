import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, aboutPages } from "../_helpers/db";
import { asc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const rows = await db
      .select({ slug: aboutPages.slug, label: aboutPages.label })
      .from(aboutPages)
      .orderBy(asc(aboutPages.createdAt));
    return res.json(rows);
  }

  if (req.method === "POST") {
    try {
      await requireAdmin(req);
      const { slug, label } = req.body as { slug?: string; label?: string };
      if (!slug || !label) return res.status(400).json({ error: "slug and label required" });

      const inserted = await db
        .insert(aboutPages)
        .values({ slug, label: label.trim() })
        .returning({ slug: aboutPages.slug, label: aboutPages.label });

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
