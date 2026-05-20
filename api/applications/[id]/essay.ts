import type { VercelRequest, VercelResponse } from "@vercel/node";
import { get } from "@vercel/blob";
import { requireAdmin } from "../../_helpers/auth";
import { db, applications, eq } from "../../_helpers/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    await requireAdmin(req);
    const { id } = req.query as { id: string };
    if (!id) return res.status(400).json({ error: "Missing id" });

    const rows = await db
      .select({ attachments: applications.attachments })
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);

    if (rows.length === 0) return res.status(404).json({ error: "Application not found" });

    const attachments = (rows[0].attachments as any[]) ?? [];
    if (attachments.length === 0) return res.status(404).json({ error: "No essay attached" });

    const fieldId = req.query.fieldId as string | undefined;
    const essay = fieldId
      ? attachments.find((a: any) => a.fieldId === fieldId)
      : attachments[0];
    if (!essay) return res.status(404).json({ error: "Attachment not found" });

    if (essay.url) {
      console.log("[essay] url:", essay.url);
      const blobRes = await get(essay.url, {
        access: "private",
        token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN!,
      });
      console.log("[essay] get() result:", JSON.stringify(blobRes));
      const blobMeta = (blobRes as any).blob ?? blobRes;
      const stream = (blobRes as any).stream as ReadableStream | undefined;
      if (!stream) return res.status(404).json({ error: "File not found in storage" });

      const name = essay.name ?? "essay";
      res.setHeader("Content-Type", blobMeta.contentType ?? "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${name}"`);

      const reader = stream.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) { res.end(); return; }
        res.write(Buffer.from(value));
        await pump();
      };
      return pump();
    }

    // Legacy: path is a Supabase storage path — cannot serve without Supabase
    return res.status(410).json({
      error: "Essay not yet migrated to new storage. Check back after storage migration.",
      path: essay.path,
    });
  } catch (e: any) {
    console.error("[essay] error:", e);
    return res.status(e.status ?? 500).json({ error: e.message, stack: e.stack });
  }
}
