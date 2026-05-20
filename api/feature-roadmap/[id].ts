import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, featureRoadmap, eq } from "../_helpers/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string };

  if (req.method === "PUT") {
    try {
      await requireAdmin(req);
      if (!id) return res.status(400).json({ error: "Missing id" });

      const body = req.body as Record<string, unknown>;
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      const allowed = ["title", "description", "category", "priority", "status", "notes"] as const;
      for (const key of allowed) {
        if (key in body) patch[key] = body[key];
      }
      if ("sort_order" in body) patch.sortOrder = Number(body.sort_order);
      if ("sortOrder" in body) patch.sortOrder = Number(body.sortOrder);

      await db.update(featureRoadmap).set(patch as never).where(eq(featureRoadmap.id, id));
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(e.status ?? 500).json({ error: e.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      await requireAdmin(req);
      if (!id) return res.status(400).json({ error: "Missing id" });
      await db.delete(featureRoadmap).where(eq(featureRoadmap.id, id));
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(e.status ?? 500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
