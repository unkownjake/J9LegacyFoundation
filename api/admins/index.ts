import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClerkClient } from "@clerk/backend";
import { requireAdmin } from "../_helpers/auth";
import { db, userRoles, adminNotificationPrefs, eq } from "../_helpers/db";
import { asc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    await requireAdmin(req);

    const roles = await db
      .select({
        id: userRoles.id,
        userId: userRoles.userId,
        createdAt: userRoles.createdAt,
      })
      .from(userRoles)
      .where(eq(userRoles.role, "admin"))
      .orderBy(asc(userRoles.createdAt));

    const prefs = await db
      .select({
        userId: adminNotificationPrefs.userId,
        notifyApplications: adminNotificationPrefs.notifyApplications,
        notifyDonations: adminNotificationPrefs.notifyDonations,
        notifyEventSubmissions: adminNotificationPrefs.notifyEventSubmissions,
      })
      .from(adminNotificationPrefs);

    const prefsMap = new Map(prefs.map((p) => [p.userId, p]));

    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    const result = await Promise.all(
      roles.map(async (r) => {
        let email: string | null = null;
        try {
          const user = await clerk.users.getUser(r.userId);
          email =
            user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
            null;
        } catch {
          // user deleted
        }
        const p = prefsMap.get(r.userId);
        return {
          id: r.id,
          user_id: r.userId,
          email,
          created_at: r.createdAt,
          prefs: {
            notify_applications: p?.notifyApplications ?? true,
            notify_donations: p?.notifyDonations ?? true,
            notify_event_submissions: p?.notifyEventSubmissions ?? true,
          },
        };
      }),
    );

    return res.json({ ok: true, admins: result });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
