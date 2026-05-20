import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin, getVerifiedUserId } from "../_helpers/auth";
import { db, pages, eq } from "../_helpers/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query as { slug: string };
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  if (req.method === "GET") {
    const rows = await db
      .select({ content: pages.content, updatedAt: pages.updatedAt })
      .from(pages)
      .where(eq(pages.slug, slug))
      .limit(1);

    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    return res.json(rows[0]);
  }

  if (req.method === "PUT") {
    try {
      const userId = await requireAdmin(req);
      const { content } = req.body as { content?: unknown };
      if (content === undefined) return res.status(400).json({ error: "Missing content" });

      await db
        .insert(pages)
        .values({ slug, content: content as never, updatedBy: userId })
        .onConflictDoUpdate({
          target: pages.slug,
          set: { content: content as never, updatedBy: userId, updatedAt: new Date() },
        });

      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(e.status ?? 500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
