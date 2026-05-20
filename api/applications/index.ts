import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_helpers/auth";
import { db, applications } from "../_helpers/db";
import { desc } from "drizzle-orm";

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      await requireAdmin(req);
      const rows = await db
        .select()
        .from(applications)
        .orderBy(desc(applications.createdAt));
      return res.json(rows);
    } catch (e: any) {
      return res.status(e.status ?? 500).json({ error: e.message });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body as {
        applicant_name?: string;
        applicant_email?: string;
        applicant_phone?: string;
        status?: string;
        answers?: Record<string, unknown>;
        attachments?: unknown[];
      };

      const name = (body.applicant_name ?? "").trim();
      const email = (body.applicant_email ?? "").trim();
      if (!name || name.length > 200) return res.status(400).json({ error: "Invalid name" });
      if (!email || !isEmail(email)) return res.status(400).json({ error: "Invalid email" });
      // status must be "new" from public submissions
      if (body.status && body.status !== "new") {
        return res.status(400).json({ error: "Invalid status" });
      }

      const inserted = await db
        .insert(applications)
        .values({
          applicantName: name,
          applicantEmail: email,
          applicantPhone: body.applicant_phone ?? null,
          status: "new",
          answers: (body.answers ?? {}) as never,
          attachments: (body.attachments ?? []) as never,
        })
        .returning({ id: applications.id });

      return res.status(201).json({ ok: true, id: inserted[0]?.id });
    } catch (e: any) {
      return res.status(e.status ?? 500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
