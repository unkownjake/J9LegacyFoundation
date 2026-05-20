import type { VercelRequest } from "@vercel/node";
import { verifyToken } from "@clerk/backend";
import { db, userRoles, eq, and } from "./db";

export async function getVerifiedUserId(req: VercelRequest): Promise<string | null> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    return payload.sub;
  } catch {
    return null;
  }
}

export async function requireAdmin(req: VercelRequest): Promise<string> {
  const userId = await getVerifiedUserId(req);
  if (!userId) throw Object.assign(new Error("Unauthorized"), { status: 401 });

  const rows = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "admin")))
    .limit(1);

  if (rows.length === 0) throw Object.assign(new Error("Forbidden"), { status: 403 });
  return userId;
}
