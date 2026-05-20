import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClerkClient } from "@clerk/backend";
import { requireAdmin } from "../_helpers/auth";
import { db, userRoles, adminNotificationPrefs } from "../_helpers/db";

const isValidEmail = (s: unknown): s is string =>
  typeof s === "string" && s.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await requireAdmin(req);

    const email =
      typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email" });

    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    const list = await clerk.users.getUserList({ emailAddress: [email], limit: 5 });
    const target = list.data.find(
      (u) =>
        u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === email),
    );

    if (!target) {
      return res.status(404).json({
        error: "No signed-up user with that email. Ask them to sign up first.",
      });
    }

    const targetId = target.id;

    // Idempotent insert — ignore unique violation
    try {
      await db.insert(userRoles).values({ userId: targetId, role: "admin" });
    } catch (e: any) {
      if (!e.message?.includes("duplicate") && !e.message?.includes("unique")) throw e;
    }

    // Ensure notification prefs row exists
    try {
      await db
        .insert(adminNotificationPrefs)
        .values({ userId: targetId })
        .onConflictDoNothing();
    } catch {
      // already exists
    }

    return res.json({ ok: true, user_id: targetId, email });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
