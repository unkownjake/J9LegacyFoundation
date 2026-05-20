import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClerkClient } from "@clerk/backend";
import { getVerifiedUserId } from "../_helpers/auth";
import { db, userRoles, adminNotificationPrefs, pendingAdminInvites, eq } from "../_helpers/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const userId = await getVerifiedUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const clerkUser = await clerk.users.getUser(userId);
  const email = clerkUser.emailAddresses
    .find((e) => e.id === clerkUser.primaryEmailAddressId)
    ?.emailAddress?.toLowerCase();

  if (!email) return res.status(400).json({ error: "No email on account" });

  const pending = await db
    .select()
    .from(pendingAdminInvites)
    .where(eq(pendingAdminInvites.email, email))
    .limit(1);

  if (pending.length === 0) {
    return res.status(404).json({ error: "No pending invite for this email" });
  }

  // Grant admin
  try {
    await db.insert(userRoles).values({ userId, role: "admin" });
  } catch (e: any) {
    if (!e.message?.includes("duplicate") && !e.message?.includes("unique")) throw e;
  }
  await db.insert(adminNotificationPrefs).values({ userId }).onConflictDoNothing();

  // Remove pending invite
  await db.delete(pendingAdminInvites).where(eq(pendingAdminInvites.email, email));

  return res.json({ ok: true });
}
