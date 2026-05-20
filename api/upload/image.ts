import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";
import { requireAdmin } from "../_helpers/auth";

export const config = { api: { bodyParser: false } };

function readBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await requireAdmin(req);

    const filename = req.query.filename as string;
    if (!filename) return res.status(400).json({ error: "Missing filename query param" });

    const body = await readBody(req);
    const blob = await put(`site-images/${filename}`, body, {
      access: "public",
      contentType: req.headers["content-type"],
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    });

    return res.json({ url: blob.url });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
