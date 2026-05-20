import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";
import { requireAdmin } from "../_helpers/auth";

export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await requireAdmin(req);

    const filename = req.query.filename as string;
    if (!filename) return res.status(400).json({ error: "Missing filename query param" });

    const blob = await put(`site-documents/${filename}`, req, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    });

    return res.json({ url: blob.url });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
