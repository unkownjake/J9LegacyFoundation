import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClerkClient } from "@clerk/backend";
import { requireAdmin } from "../_helpers/auth";
import { db, userRoles, adminNotificationPrefs, pendingAdminInvites } from "../_helpers/db";

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

    // Check if they already have an account — if so, grant directly
    const list = await clerk.users.getUserList({ emailAddress: [email], limit: 5 });
    const existing = list.data.find((u) =>
      u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === email),
    );

    if (existing) {
      try {
        await db.insert(userRoles).values({ userId: existing.id, role: "admin" });
      } catch (e: any) {
        if (!e.message?.includes("duplicate") && !e.message?.includes("unique")) throw e;
      }
      await db.insert(adminNotificationPrefs).values({ userId: existing.id }).onConflictDoNothing();
      return res.json({ ok: true, mode: "granted", email });
    }

    // No account yet — record pending invite and send Clerk invitation
    await db.insert(pendingAdminInvites).values({ email }).onConflictDoNothing();

    const origin = (req.headers.origin as string | undefined) ?? "https://j9legacy.org";
    await clerk.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${origin}/auth`,
      ignoreExisting: true,
    });

    return res.json({ ok: true, mode: "invited", email });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
