import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, adminNotificationPrefs, eq } from "../_helpers/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  try {
    const userId = await requireAdmin(req);

    const body = req.body as {
      notify_applications?: boolean;
      notify_donations?: boolean;
      notify_event_submissions?: boolean;
    };

    await db
      .insert(adminNotificationPrefs)
      .values({
        userId,
        notifyApplications: body.notify_applications ?? true,
        notifyDonations: body.notify_donations ?? true,
        notifyEventSubmissions: body.notify_event_submissions ?? true,
      })
      .onConflictDoUpdate({
        target: adminNotificationPrefs.userId,
        set: {
          notifyApplications: body.notify_applications ?? true,
          notifyDonations: body.notify_donations ?? true,
          notifyEventSubmissions: body.notify_event_submissions ?? true,
          updatedAt: new Date(),
        },
      });

    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
