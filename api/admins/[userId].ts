import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, userRoles, adminNotificationPrefs, eq, and, sql } from "../_helpers/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  try {
    await requireAdmin(req);

    const { userId } = req.query as { userId: string };
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userRoles)
      .where(eq(userRoles.role, "admin"));
    if ((countResult[0]?.count ?? 0) <= 1) {
      return res.status(400).json({ error: "Cannot remove the last admin." });
    }

    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "admin")));

    await db
      .delete(adminNotificationPrefs)
      .where(eq(adminNotificationPrefs.userId, userId));

    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
