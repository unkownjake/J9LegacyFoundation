import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, applications, eq } from "../_helpers/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "PUT") {
    try {
      await requireAdmin(req);
      const { id } = req.query as { id: string };
      if (!id) return res.status(400).json({ error: "Missing id" });

      const body = req.body as Record<string, unknown>;
      const allowed = ["status", "notes"] as const;
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      for (const key of allowed) {
        if (key in body) patch[key] = body[key];
      }

      await db.update(applications).set(patch as never).where(eq(applications.id, id));
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(e.status ?? 500).json({ error: e.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      await requireAdmin(req);
      const { id } = req.query as { id: string };
      if (!id) return res.status(400).json({ error: "Missing id" });

      await db.delete(applications).where(eq(applications.id, id));
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(e.status ?? 500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
