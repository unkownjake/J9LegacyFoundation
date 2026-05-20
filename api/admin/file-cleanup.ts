import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, del } from "@vercel/blob";
import { requireAdmin } from "../_helpers/auth";
import { db, pages, events } from "../_helpers/db";

const MANAGED_PREFIXES = ["site-images/", "site-documents/"];

async function listAllManagedBlobs() {
  const all: Awaited<ReturnType<typeof list>>["blobs"] = [];
  for (const prefix of MANAGED_PREFIXES) {
    let cursor: string | undefined;
    while (true) {
      const result = await list({
        prefix,
        token: process.env.BLOB_READ_WRITE_TOKEN!,
        cursor,
        limit: 1000,
      });
      all.push(...result.blobs);
      if (!result.hasMore) break;
      cursor = result.cursor;
    }
  }
  return all;
}

function collectUrls(value: unknown, out: Set<string>): void {
  if (typeof value === "string") {
    if (value.includes(".blob.vercel-storage.com/")) out.add(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, out);
  } else if (value !== null && typeof value === "object") {
    for (const v of Object.values(value)) collectUrls(v, out);
  }
}

async function getReferencedUrls(): Promise<Set<string>> {
  const urls = new Set<string>();

  const [allPages, allEvents] = await Promise.all([
    db.select({ content: pages.content }).from(pages),
    db.select({
      heroImage: events.heroImage,
      gallery: events.gallery,
      documents: events.documents,
      pageContent: events.pageContent,
    }).from(events),
  ]);

  for (const p of allPages) collectUrls(p.content, urls);

  for (const e of allEvents) {
    if (e.heroImage) urls.add(e.heroImage);
    collectUrls(e.gallery, urls);
    collectUrls(e.documents, urls);
    collectUrls(e.pageContent, urls);
  }

  return urls;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await requireAdmin(req);

    if (req.method === "GET") {
      const [blobs, referenced] = await Promise.all([
        listAllManagedBlobs(),
        getReferencedUrls(),
      ]);
      const orphaned = blobs.filter((b) => !referenced.has(b.url));
      return res.json({ orphaned });
    }

    if (req.method === "DELETE") {
      const { urls } = req.body as { urls: string[] };
      if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: "urls must be a non-empty array" });
      }
      await del(urls, { token: process.env.BLOB_READ_WRITE_TOKEN! });
      return res.json({ deleted: urls.length });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}
