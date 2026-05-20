import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put, list, del, get } from "@vercel/blob";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { requireAdmin, getVerifiedUserId } from "./_helpers/auth.js";
import { db, events, eventSubmissions, applications, donations, pages, aboutPages, featureRoadmap, userRoles, adminNotificationPrefs, pendingAdminInvites, eq, and, sql } from "./_helpers/db.js";
import { asc, desc, isNull, ne } from "drizzle-orm";
import { sendTransactional, renderTemplate, type EmailTemplate, type NotifyType } from "./_helpers/email.js";
import { randomUUID } from "crypto";

// Disable body parsing so upload routes can stream the raw request body.
// All non-upload routes manually parse JSON below.
export const config = { api: { bodyParser: false } };

// ─── Helpers ────────────────────────────────────────────────────────────────

function readBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function parseJson(req: VercelRequest): Promise<any> {
  const buf = await readBody(req);
  try { return JSON.parse(buf.toString()); } catch { return {}; }
}

// Parse path segments from req.url, skipping the leading "/api" prefix.
// This is more reliable than req.query["...params"] because vercel dev
// exposes the catch-all key as "...params" (with literal dots), and rewrites
// can mangle that value. req.url always preserves the original request path.
function parsePath(req: VercelRequest): string[] {
  const raw = req.url ?? "";
  const pathname = raw.split("?")[0]; // drop query string
  return pathname.split("/").filter(Boolean).slice(1); // drop leading "api"
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isValidEmail = (s: unknown): s is string =>
  typeof s === "string" && s.length <= 320 && isEmail(s);

function formatWhen(starts: Date | null, ends: Date | null): string {
  if (!starts) return "";
  try {
    let out = starts.toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", timeZoneName: "short",
    });
    if (ends) out += ` – ${ends.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    return out;
  } catch { return starts.toISOString(); }
}

async function getPaypalToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Missing PayPal credentials");
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const r = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ─── Route handlers ──────────────────────────────────────────────────────────

// POST /api/upload/image|document|essay
async function handleUpload(req: VercelRequest, res: VercelResponse, type: string) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const filename = req.query.filename as string;
  if (!filename) return res.status(400).json({ error: "Missing filename query param" });

  try {
    if (type === "image") {
      await requireAdmin(req);
      const body = await readBody(req);
      const blob = await put(`site-images/${filename}`, body, {
        access: "public", contentType: req.headers["content-type"],
        token: process.env.BLOB_READ_WRITE_TOKEN!,
      });
      return res.json({ url: blob.url });
    }
    if (type === "document") {
      await requireAdmin(req);
      const blob = await put(`site-documents/${filename}`, req, {
        access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
      });
      return res.json({ url: blob.url });
    }
    if (type === "essay") {
      const body = await readBody(req);
      const year = new Date().getFullYear();
      const blob = await put(`application-essays/${year}/${filename}`, body, {
        access: "private", contentType: req.headers["content-type"],
        token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN!,
      });
      return res.json({ url: blob.url });
    }
    return res.status(404).json({ error: "Unknown upload type" });
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}

// GET|PUT /api/pages/[slug]
async function handlePages(req: VercelRequest, res: VercelResponse, body: any, rest: string[]) {
  const slug = rest[0];
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  if (req.method === "GET") {
    const rows = await db.select({ content: pages.content, updatedAt: pages.updatedAt })
      .from(pages).where(eq(pages.slug, slug)).limit(1);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    return res.json(rows[0]);
  }
  if (req.method === "PUT") {
    try {
      const userId = await requireAdmin(req);
      if (body.content === undefined) return res.status(400).json({ error: "Missing content" });
      await db.insert(pages).values({ slug, content: body.content as never, updatedBy: userId })
        .onConflictDoUpdate({ target: pages.slug, set: { content: body.content as never, updatedBy: userId, updatedAt: new Date() } });
      return res.json({ ok: true });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }
  return res.status(405).json({ error: "Method not allowed" });
}

// /api/events
function toDbPatch(b: Record<string, unknown>): Record<string, unknown> {
  const MAP: Record<string, string> = {
    title: "title", subtitle: "subtitle", description: "description", location: "location",
    starts_at: "startsAt", ends_at: "endsAt", hero_image: "heroImage",
    registration_url: "registrationUrl", published: "published", sort_order: "sortOrder",
    event_type: "eventType", cost_description: "costDescription", payment_note: "paymentNote",
    registration_deadline: "registrationDeadline", capacity: "capacity",
    registration_open: "registrationOpen", recap: "recap", page_content: "pageContent",
    pricing_tiers: "pricingTiers", registration_form: "registrationForm", cost_amount: "costAmount",
    organizer_name: "organizerName", organizer_email: "organizerEmail",
    organizer_phone: "organizerPhone", documents: "documents", slug: "slug",
    gallery: "gallery",
  };
  const DATE_FIELDS = new Set(["startsAt", "endsAt"]);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(b)) {
    const mapped = MAP[k] ?? k;
    result[mapped] = DATE_FIELDS.has(mapped) && typeof v === "string" && v ? new Date(v) : v;
  }
  result.updatedAt = new Date();
  return result;
}

async function handleEvents(req: VercelRequest, res: VercelResponse, body: any, rest: string[]) {
  const [id, sub] = rest;

  if (!id) {
    // GET /api/events  POST /api/events
    if (req.method === "GET") {
      const adminMode = req.query.admin === "1";
      if (adminMode) {
        try { await requireAdmin(req); } catch (e: any) { return res.status(e.status ?? 403).json({ error: e.message }); }
      }
      const rows = await db.select().from(events)
        .where(adminMode ? undefined : eq(events.published, true))
        .orderBy(desc(events.startsAt));
      return res.json(rows);
    }
    if (req.method === "POST") {
      try {
        await requireAdmin(req);
        if (!body.title || !body.slug) return res.status(400).json({ error: "title and slug are required" });
        const inserted = await db.insert(events).values({
          title: body.title, slug: body.slug, eventType: body.event_type ?? "dropin", published: false,
        }).returning();
        return res.status(201).json(inserted[0]);
      } catch (e: any) {
        if (e.message?.includes("unique") || e.message?.includes("duplicate"))
          return res.status(409).json({ error: "Slug already exists" });
        return res.status(e.status ?? 500).json({ error: e.message });
      }
    }
    return res.status(405).json({ error: "Method not allowed" });
  }

  // GET /api/events/[id]/attendance
  if (sub === "attendance") {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const rows = await db.select({ count: sql<number>`count(*)::int` })
      .from(eventSubmissions)
      .where(and(eq(eventSubmissions.eventId, id), isNull(eventSubmissions.cancelledAt)));
    return res.json({ count: rows[0]?.count ?? 0 });
  }

  // GET|PUT|DELETE /api/events/[id]
  if (req.method === "GET") {
    const bySlug = await db.select().from(events).where(eq(events.slug, id)).limit(1);
    if (bySlug.length > 0) return res.json(bySlug[0]);
    const byId = await db.select().from(events).where(eq(events.id, id)).limit(1);
    if (byId.length > 0) return res.json(byId[0]);
    return res.status(404).json({ error: "Not found" });
  }
  if (req.method === "PUT") {
    try {
      await requireAdmin(req);
      const patch = toDbPatch(body);
      await db.update(events).set(patch as never).where(eq(events.id, id));
      return res.json({ ok: true });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }
  if (req.method === "DELETE") {
    try {
      await requireAdmin(req);
      await db.delete(events).where(eq(events.id, id));
      return res.json({ ok: true });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }
  return res.status(405).json({ error: "Method not allowed" });
}

// /api/applications
async function handleApplications(req: VercelRequest, res: VercelResponse, body: any, rest: string[]) {
  const [id, sub] = rest;

  if (!id) {
    if (req.method === "GET") {
      try {
        await requireAdmin(req);
        const rows = await db.select().from(applications).orderBy(desc(applications.createdAt));
        return res.json(rows);
      } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
    }
    if (req.method === "POST") {
      try {
        const name = (body.applicant_name ?? "").trim();
        const email = (body.applicant_email ?? "").trim();
        if (!name || name.length > 200) return res.status(400).json({ error: "Invalid name" });
        if (!email || !isEmail(email)) return res.status(400).json({ error: "Invalid email" });
        if (body.status && body.status !== "new") return res.status(400).json({ error: "Invalid status" });
        const inserted = await db.insert(applications).values({
          applicantName: name, applicantEmail: email, applicantPhone: body.applicant_phone ?? null,
          status: "new", answers: (body.answers ?? {}) as never, attachments: (body.attachments ?? []) as never,
        }).returning({ id: applications.id });
        return res.status(201).json({ ok: true, id: inserted[0]?.id });
      } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
    }
    return res.status(405).json({ error: "Method not allowed" });
  }

  // GET /api/applications/[id]/essay
  if (sub === "essay") {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    try {
      await requireAdmin(req);
      const rows = await db.select({ attachments: applications.attachments })
        .from(applications).where(eq(applications.id, id)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: "Application not found" });
      const attachments = (rows[0].attachments as any[]) ?? [];
      if (attachments.length === 0) return res.status(404).json({ error: "No essay attached" });
      const fieldId = req.query.fieldId as string | undefined;
      const essay = fieldId ? attachments.find((a: any) => a.fieldId === fieldId) : attachments[0];
      if (!essay) return res.status(404).json({ error: "Attachment not found" });
      if (essay.url) {
        const blobRes = await get(essay.url, { access: "private", token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN! });
        const blobMeta = (blobRes as any).blob ?? blobRes;
        const stream = (blobRes as any).stream as ReadableStream | undefined;
        if (!stream) return res.status(404).json({ error: "File not found in storage" });
        res.setHeader("Content-Type", blobMeta.contentType ?? "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${essay.name ?? "essay"}"`);
        const reader = stream.getReader();
        const pump = async (): Promise<void> => {
          const { done, value } = await reader.read();
          if (done) { res.end(); return; }
          res.write(Buffer.from(value));
          return pump();
        };
        return pump();
      }
      return res.status(410).json({ error: "Essay not yet migrated to new storage.", path: essay.path });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }

  // PUT|DELETE /api/applications/[id]
  if (req.method === "PUT") {
    try {
      await requireAdmin(req);
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if ("status" in body) patch.status = body.status;
      if ("notes" in body) patch.notes = body.notes;
      await db.update(applications).set(patch as never).where(eq(applications.id, id));
      return res.json({ ok: true });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }
  if (req.method === "DELETE") {
    try {
      await requireAdmin(req);
      await db.delete(applications).where(eq(applications.id, id));
      return res.json({ ok: true });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }
  return res.status(405).json({ error: "Method not allowed" });
}

// /api/donations
async function handleDonations(req: VercelRequest, res: VercelResponse, body: any, rest: string[]) {
  const [segment] = rest;

  if (!segment) {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    try {
      await requireAdmin(req);
      const rows = await db.select().from(donations).orderBy(desc(donations.createdAt));
      return res.json(rows);
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }

  if (segment === "manual") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      await requireAdmin(req);
      const amt = Number(body.amount);
      if (!amt || amt <= 0) return res.status(400).json({ error: "Invalid amount" });
      const inserted = await db.insert(donations).values({
        source: body.source ?? "manual", environment: body.environment ?? "live",
        donorName: body.donor_name ?? null, donorEmail: body.donor_email ?? null,
        amount: amt.toString(), netAmount: (body.net_amount ?? amt).toString(),
        status: body.status ?? "completed",
        capturedAt: body.captured_at ? new Date(body.captured_at) : new Date(),
        notes: body.notes ?? null,
      }).returning({ id: donations.id });
      return res.status(201).json({ ok: true, id: inserted[0]?.id });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }

  if (segment === "receipt") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      const name = (body.donorName ?? "").trim();
      const email = (body.donorEmail ?? "").trim();
      if (!body.donationId || !name || !email || !isEmail(email))
        return res.status(400).json({ error: "Invalid name, email, or donation id" });
      const rows = await db.select({ id: donations.id, amount: donations.amount, feesCovered: donations.feesCovered, thankedAt: donations.thankedAt })
        .from(donations).where(eq(donations.id, body.donationId)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: "Donation not found" });
      if (rows[0].thankedAt) return res.json({ ok: true, alreadySent: true });
      await db.update(donations).set({ donorName: name, donorEmail: email }).where(eq(donations.id, body.donationId));
      await sendTransactional(email, "donation_receipt", { donorName: name, amount: rows[0].amount, feesCovered: rows[0].feesCovered ?? 0 }, { notifyType: "donations" });
      await db.update(donations).set({ thankedAt: new Date() }).where(eq(donations.id, body.donationId));
      return res.json({ ok: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // PUT /api/donations/[id]
  if (req.method === "PUT") {
    try {
      await requireAdmin(req);
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if ("thanked_at" in body) patch.thankedAt = body.thanked_at ? new Date(body.thanked_at) : null;
      if ("notes" in body) patch.notes = body.notes;
      await db.update(donations).set(patch as never).where(eq(donations.id, segment));
      return res.json({ ok: true });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }
  return res.status(405).json({ error: "Method not allowed" });
}

// /api/admins
async function handleAdmins(req: VercelRequest, res: VercelResponse, body: any, rest: string[]) {
  const [segment] = rest;

  if (!segment) {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    try {
      await requireAdmin(req);
      const roles = await db.select({ id: userRoles.id, userId: userRoles.userId, createdAt: userRoles.createdAt })
        .from(userRoles).where(eq(userRoles.role, "admin")).orderBy(asc(userRoles.createdAt));
      const prefs = await db.select({ userId: adminNotificationPrefs.userId, notifyApplications: adminNotificationPrefs.notifyApplications, notifyDonations: adminNotificationPrefs.notifyDonations, notifyEventSubmissions: adminNotificationPrefs.notifyEventSubmissions }).from(adminNotificationPrefs);
      const prefsMap = new Map(prefs.map((p) => [p.userId, p]));
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
      const result = await Promise.all(roles.map(async (r) => {
        let email: string | null = null;
        try {
          const u = await clerk.users.getUser(r.userId);
          email = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? null;
        } catch { /* deleted */ }
        const p = prefsMap.get(r.userId);
        return { id: r.id, user_id: r.userId, email, created_at: r.createdAt, prefs: { notify_applications: p?.notifyApplications ?? true, notify_donations: p?.notifyDonations ?? true, notify_event_submissions: p?.notifyEventSubmissions ?? true } };
      }));
      return res.json({ ok: true, admins: result });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }

  if (segment === "me") {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.json({ isAdmin: false });
    try {
      const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
      const rows = await db.select().from(userRoles).where(and(eq(userRoles.userId, payload.sub), eq(userRoles.role, "admin"))).limit(1);
      return res.json({ isAdmin: rows.length > 0 });
    } catch { return res.json({ isAdmin: false }); }
  }

  if (segment === "prefs") {
    if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });
    try {
      const userId = await requireAdmin(req);
      await db.insert(adminNotificationPrefs).values({ userId, notifyApplications: body.notify_applications ?? true, notifyDonations: body.notify_donations ?? true, notifyEventSubmissions: body.notify_event_submissions ?? true })
        .onConflictDoUpdate({ target: adminNotificationPrefs.userId, set: { notifyApplications: body.notify_applications ?? true, notifyDonations: body.notify_donations ?? true, notifyEventSubmissions: body.notify_event_submissions ?? true, updatedAt: new Date() } });
      return res.json({ ok: true });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }

  if (segment === "grant") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      await requireAdmin(req);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email" });
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
      const list2 = await clerk.users.getUserList({ emailAddress: [email], limit: 5 });
      const target = list2.data.find((u) => u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === email));
      if (!target) return res.status(404).json({ error: "No signed-up user with that email. Ask them to sign up first." });
      try { await db.insert(userRoles).values({ userId: target.id, role: "admin" }); } catch (e: any) { if (!e.message?.includes("duplicate") && !e.message?.includes("unique")) throw e; }
      try { await db.insert(adminNotificationPrefs).values({ userId: target.id }).onConflictDoNothing(); } catch { /* exists */ }
      return res.json({ ok: true, user_id: target.id, email });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }

  if (segment === "invite") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      await requireAdmin(req);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email" });
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
      const list2 = await clerk.users.getUserList({ emailAddress: [email], limit: 5 });
      const existing = list2.data.find((u) => u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === email));
      if (existing) {
        try { await db.insert(userRoles).values({ userId: existing.id, role: "admin" }); } catch (e: any) { if (!e.message?.includes("duplicate") && !e.message?.includes("unique")) throw e; }
        await db.insert(adminNotificationPrefs).values({ userId: existing.id }).onConflictDoNothing();
        return res.json({ ok: true, mode: "granted", email });
      }
      await db.insert(pendingAdminInvites).values({ email }).onConflictDoNothing();
      const origin = (req.headers.origin as string | undefined) ?? "https://j9legacy.org";
      await clerk.invitations.createInvitation({ emailAddress: email, redirectUrl: `${origin}/auth`, ignoreExisting: true });
      return res.json({ ok: true, mode: "invited", email });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }

  if (segment === "claim-invite") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const userId = await getVerifiedUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    const clerkUser = await clerk.users.getUser(userId);
    const email = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress?.toLowerCase();
    if (!email) return res.status(400).json({ error: "No email on account" });
    const pending = await db.select().from(pendingAdminInvites).where(eq(pendingAdminInvites.email, email)).limit(1);
    if (pending.length === 0) return res.status(404).json({ error: "No pending invite for this email" });
    try { await db.insert(userRoles).values({ userId, role: "admin" }); } catch (e: any) { if (!e.message?.includes("duplicate") && !e.message?.includes("unique")) throw e; }
    await db.insert(adminNotificationPrefs).values({ userId }).onConflictDoNothing();
    await db.delete(pendingAdminInvites).where(eq(pendingAdminInvites.email, email));
    return res.json({ ok: true });
  }

  // DELETE /api/admins/[userId]
  if (req.method === "DELETE") {
    try {
      await requireAdmin(req);
      const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(userRoles).where(eq(userRoles.role, "admin"));
      if ((countResult[0]?.count ?? 0) <= 1) return res.status(400).json({ error: "Cannot remove the last admin." });
      await db.delete(userRoles).where(and(eq(userRoles.userId, segment), eq(userRoles.role, "admin")));
      await db.delete(adminNotificationPrefs).where(eq(adminNotificationPrefs.userId, segment));
      return res.json({ ok: true });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }
  return res.status(405).json({ error: "Method not allowed" });
}

// /api/event-submissions
async function handleEventSubmissions(req: VercelRequest, res: VercelResponse, body: any, rest: string[]) {
  const [segment] = rest;

  if (!segment) {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    try {
      await requireAdmin(req);
      const { event_id } = req.query as { event_id?: string };
      const rows = await db.select().from(eventSubmissions)
        .where(event_id ? eq(eventSubmissions.eventId, event_id) : undefined)
        .orderBy(desc(eventSubmissions.createdAt));
      return res.json(rows);
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }

  if (segment === "create") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      if (!body.eventId) return res.status(400).json({ error: "Missing eventId" });
      const name = (body.submitterName ?? "").trim();
      const email = (body.submitterEmail ?? "").trim();
      if (name.length < 1 || name.length > 200) return res.status(400).json({ error: "Invalid name" });
      if (!isEmail(email) || email.length > 320) return res.status(400).json({ error: "Invalid email" });

      const eventRows = await db.select({ id: events.id, slug: events.slug, title: events.title, eventType: events.eventType, registrationOpen: events.registrationOpen, pricingTiers: events.pricingTiers, costAmount: events.costAmount, capacity: events.capacity, published: events.published, startsAt: events.startsAt, endsAt: events.endsAt, location: events.location }).from(events).where(eq(events.id, body.eventId)).limit(1);
      if (eventRows.length === 0) return res.status(404).json({ error: "Event not found" });
      const event = eventRows[0];
      if (!event.published) return res.status(400).json({ error: "Event not available" });
      if (!event.registrationOpen) return res.status(400).json({ error: "Registration is closed" });
      if (event.eventType === "dropin") return res.status(400).json({ error: "Drop-in events do not require submission" });

      const tiers = Array.isArray(event.pricingTiers) ? (event.pricingTiers as any[]) : [];
      let tier: any = null;
      if (event.eventType === "registration" && tiers.length > 0) {
        tier = tiers.find((t: any) => t.id === body.pricingTierId);
        if (!tier) return res.status(400).json({ error: "Invalid pricing tier" });
      }
      const amount = tier ? Number(tier.price) || 0 : Number(event.costAmount) || 0;

      if (event.capacity) {
        const countRows = await db.select({ cnt: sql<number>`count(*)::int` }).from(eventSubmissions).where(and(eq(eventSubmissions.eventId, event.id), ne(eventSubmissions.status, "cancelled")));
        if (Number(countRows[0]?.cnt ?? 0) >= event.capacity) return res.status(400).json({ error: "This event is full" });
      }

      let paymentMethod: "free" | "in_person" | "paypal" = "free";
      let paymentStatus = "not_required";
      if (amount > 0) {
        paymentMethod = body.paymentMethod === "paypal" ? "paypal" : "in_person";
        paymentStatus = paymentMethod === "paypal" ? "pending" : "owed_in_person";
      }
      const status = paymentMethod === "paypal" ? "pending" : "confirmed";
      const roster = Array.isArray(body.roster) ? body.roster.slice(0, 100) : [];
      if (tier?.kind === "team") {
        const min = Number(tier.rosterMin) || 0; const max = Number(tier.rosterMax) || 0;
        if (min && roster.length < min) return res.status(400).json({ error: `Roster needs at least ${min} players` });
        if (max && roster.length > max) return res.status(400).json({ error: `Roster can have at most ${max} players` });
      }

      let paypalOrderId: string | null = null;
      if (paymentMethod === "paypal") {
        const token = await getPaypalToken();
        const orderRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ description: (tier?.name ?? "Event registration").slice(0, 127), amount: { currency_code: "USD", value: amount.toFixed(2) } }], application_context: { brand_name: "J9 Legacy Foundation", user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING" } }) });
        const order = await orderRes.json();
        if (!orderRes.ok) return res.status(500).json({ error: "PayPal order failed", detail: order });
        paypalOrderId = order.id;
      }

      const headcount = Math.max(1, Math.floor(Number(body.headcount) || 1));
      const magicToken = randomUUID();
      const inserted = await db.insert(eventSubmissions).values({ eventId: event.id, status, pricingTierId: tier?.id ?? null, pricingTierName: tier?.name ?? null, pricingTierKind: tier?.kind ?? null, amount: amount.toString(), paymentMethod, paymentStatus, paypalOrderId, submitterName: name, submitterEmail: email, submitterPhone: body.submitterPhone?.trim() || null, teamName: body.teamName?.trim() || null, roster, headcount, answers: body.answers ?? {}, magicToken }).returning({ id: eventSubmissions.id, magicToken: eventSubmissions.magicToken });
      if (!inserted[0]) return res.status(500).json({ error: "Insert failed" });
      const { id: submissionId, magicToken: tok } = inserted[0];

      if (paymentMethod !== "paypal") {
        const origin = (body.siteOrigin || "https://j9legacy.org").replace(/\/$/, "");
        await sendTransactional(email, "event_confirmation", { submitterName: name, eventTitle: event.title, eventType: event.eventType, eventWhen: formatWhen(event.startsAt, event.endsAt), eventWhere: event.location ?? "", headcount, amount, paymentMethod, manageUrl: `${origin}/events/${event.slug}/manage?id=${submissionId}&token=${tok}` }, { notifyType: "event_submissions" });
      }
      return res.json({ ok: true, submissionId, magicToken: tok, paypalOrderId, amount, paymentMethod });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  if (segment === "capture") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      if (!body.submissionId || !body.magicToken || !body.orderId) return res.status(400).json({ error: "Missing fields" });
      const subRows = await db.select().from(eventSubmissions).where(and(eq(eventSubmissions.id, body.submissionId), eq(eventSubmissions.magicToken, body.magicToken))).limit(1);
      if (subRows.length === 0) return res.status(404).json({ error: "Submission not found" });
      const sub = subRows[0];
      if (sub.paypalOrderId !== body.orderId) return res.status(400).json({ error: "Order mismatch" });
      const token = await getPaypalToken();
      const capRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${body.orderId}/capture`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      const capture = await capRes.json();
      if (!capRes.ok) return res.status(500).json({ error: "Capture failed", detail: capture });
      const cap = capture.purchase_units?.[0]?.payments?.captures?.[0];
      await db.update(eventSubmissions).set({ status: "confirmed", paymentStatus: cap?.status === "COMPLETED" ? "paid" : "pending", paypalCaptureId: cap?.id ?? null }).where(eq(eventSubmissions.id, sub.id));
      const evRows = await db.select({ slug: events.slug, title: events.title, eventType: events.eventType, startsAt: events.startsAt, endsAt: events.endsAt, location: events.location }).from(events).where(eq(events.id, sub.eventId)).limit(1);
      if (evRows.length > 0) {
        const ev = evRows[0];
        const origin = (body.siteOrigin || "https://j9legacy.org").replace(/\/$/, "");
        await sendTransactional(sub.submitterEmail, "event_confirmation", { submitterName: sub.submitterName, eventTitle: ev.title, eventType: ev.eventType, eventWhen: formatWhen(ev.startsAt, ev.endsAt), eventWhere: ev.location ?? "", headcount: sub.headcount ?? 1, amount: sub.amount, paymentMethod: "paypal", manageUrl: `${origin}/events/${ev.slug}/manage?id=${sub.id}&token=${body.magicToken}` }, { notifyType: "event_submissions" });
      }
      return res.json({ ok: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  if (segment === "manage") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      if (!body.submissionId || !body.magicToken) return res.status(400).json({ error: "Missing fields" });
      const subRows = await db.select({ id: eventSubmissions.id, eventId: eventSubmissions.eventId, status: eventSubmissions.status, pricingTierName: eventSubmissions.pricingTierName, pricingTierKind: eventSubmissions.pricingTierKind, amount: eventSubmissions.amount, paymentMethod: eventSubmissions.paymentMethod, paymentStatus: eventSubmissions.paymentStatus, submitterName: eventSubmissions.submitterName, submitterEmail: eventSubmissions.submitterEmail, submitterPhone: eventSubmissions.submitterPhone, headcount: eventSubmissions.headcount, teamName: eventSubmissions.teamName, roster: eventSubmissions.roster, answers: eventSubmissions.answers, createdAt: eventSubmissions.createdAt, cancelledAt: eventSubmissions.cancelledAt }).from(eventSubmissions).where(and(eq(eventSubmissions.id, body.submissionId), eq(eventSubmissions.magicToken, body.magicToken))).limit(1);
      if (subRows.length === 0) return res.status(404).json({ error: "Not found" });
      const sub = subRows[0];
      const evRows = await db.select({ id: events.id, slug: events.slug, title: events.title, startsAt: events.startsAt, endsAt: events.endsAt, location: events.location, eventType: events.eventType }).from(events).where(eq(events.id, sub.eventId)).limit(1);
      const event = evRows[0] ?? null;
      if (body.action === "cancel") {
        if (sub.status === "cancelled") return res.json({ ok: true, submission: sub, event });
        const updated = await db.update(eventSubmissions).set({ status: "cancelled", cancelledAt: new Date() }).where(eq(eventSubmissions.id, sub.id)).returning();
        await sendTransactional(sub.submitterEmail, "event_cancelled", { submitterName: sub.submitterName, eventTitle: event?.title ?? "the event", eventType: event?.eventType ?? "registration" }, { notifyType: "event_submissions" });
        return res.json({ ok: true, submission: updated[0], event });
      }
      return res.json({ ok: true, submission: sub, event });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // DELETE /api/event-submissions/[id]
  if (req.method === "DELETE") {
    try {
      await requireAdmin(req);
      await db.delete(eventSubmissions).where(eq(eventSubmissions.id, segment));
      return res.json({ ok: true });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }
  return res.status(405).json({ error: "Method not allowed" });
}

// /api/paypal
async function handlePaypal(req: VercelRequest, res: VercelResponse, body: any, rest: string[]) {
  const [action] = rest;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (action === "create-order") {
    try {
      const amount = Number(body.amount);
      if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
      const token = await getPaypalToken();
      const orderRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ description: "J9 Legacy Foundation Donation", custom_id: JSON.stringify({ donorName: body.donorName ?? "", donorEmail: body.donorEmail ?? "", feesCovered: body.feesCovered ?? 0 }).slice(0, 127), amount: { currency_code: "USD", value: amount.toFixed(2) } }], application_context: { brand_name: "J9 Legacy Foundation", user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING" } }) });
      const order = await orderRes.json();
      if (!orderRes.ok) return res.status(500).json({ error: "PayPal order failed", detail: order });
      return res.json({ id: order.id });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  if (action === "capture-order") {
    try {
      if (!body.orderId) return res.status(400).json({ error: "Missing orderId" });
      const token = await getPaypalToken();
      const capRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${body.orderId}/capture`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      const capture = await capRes.json();
      if (!capRes.ok) return res.status(500).json({ error: "Capture failed", detail: capture });
      const pu = capture.purchase_units?.[0]; const cap = pu?.payments?.captures?.[0]; const payer = capture.payer ?? {};
      const amount = parseFloat(cap?.amount?.value ?? "0");
      const fees = parseFloat(cap?.seller_receivable_breakdown?.paypal_fee?.value ?? "0");
      const net = parseFloat(cap?.seller_receivable_breakdown?.net_amount?.value ?? `${amount - fees}`);
      const donorName = body.donorName || [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(" ");
      const donorEmail = body.donorEmail || payer.email_address || null;
      const ps = capture.payment_source ?? {}; const capPs = (cap as any)?.payment_source ?? {};
      const walletBrand = String(ps?.wallet?.brand ?? capPs?.wallet?.brand ?? "").toLowerCase();
      const isVenmo = !!ps?.venmo || !!capPs?.venmo || walletBrand === "venmo";
      const source = body.source ?? (isVenmo ? "venmo" : "paypal");
      const inserted = await db.insert(donations).values({ source, donorName: donorName || null, donorEmail, amount: amount.toString(), feesCovered: (body.feesCovered ?? 0).toString(), netAmount: net.toString(), currency: cap?.amount?.currency_code ?? "USD", paypalOrderId: capture.id, paypalCaptureId: cap?.id ?? null, payerId: payer.payer_id ?? null, status: cap?.status === "COMPLETED" ? "completed" : "pending", capturedAt: cap?.create_time ? new Date(cap.create_time) : new Date(), rawPayload: capture }).returning({ id: donations.id });
      const donationId = inserted[0]?.id ?? null;
      const hasContact = !!(donorName && donorEmail);
      if (hasContact && donationId) {
        try {
          await sendTransactional(donorEmail!, "donation_receipt", { donorName, amount, feesCovered: body.feesCovered ?? 0 }, { notifyType: "donations" });
          await db.update(donations).set({ thankedAt: new Date() }).where(eq(donations.id, donationId));
        } catch (e) { console.warn("Receipt send failed:", e); }
      }
      return res.json({ ok: true, captureId: cap?.id, amount, donorName, donorEmail, donationId, needsContact: !hasContact });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }
  return res.status(404).json({ error: "Not found" });
}

// /api/feature-roadmap
async function handleFeatureRoadmap(req: VercelRequest, res: VercelResponse, body: any, rest: string[]) {
  const [id] = rest;
  if (!id) {
    if (req.method === "GET") {
      const rows = await db.select().from(featureRoadmap).orderBy(asc(featureRoadmap.sortOrder), asc(featureRoadmap.createdAt));
      return res.json(rows);
    }
    if (req.method === "POST") {
      try {
        await requireAdmin(req);
        const inserted = await db.insert(featureRoadmap).values({ title: String(body.title ?? ""), description: body.description ? String(body.description) : null, category: String(body.category ?? "general"), priority: String(body.priority ?? "medium"), status: String(body.status ?? "planned"), notes: body.notes ? String(body.notes) : null, sortOrder: Number(body.sort_order ?? body.sortOrder ?? 0) }).returning();
        return res.status(201).json(inserted[0]);
      } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
    }
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (req.method === "PUT") {
    try {
      await requireAdmin(req);
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      for (const key of ["title", "description", "category", "priority", "status", "notes"] as const) { if (key in body) patch[key] = body[key]; }
      if ("sort_order" in body) patch.sortOrder = Number(body.sort_order);
      if ("sortOrder" in body) patch.sortOrder = Number(body.sortOrder);
      await db.update(featureRoadmap).set(patch as never).where(eq(featureRoadmap.id, id));
      return res.json({ ok: true });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }
  if (req.method === "DELETE") {
    try {
      await requireAdmin(req);
      await db.delete(featureRoadmap).where(eq(featureRoadmap.id, id));
      return res.json({ ok: true });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }
  return res.status(405).json({ error: "Method not allowed" });
}

// /api/about-pages
async function handleAboutPages(req: VercelRequest, res: VercelResponse, body: any, rest: string[]) {
  const [slug] = rest;
  if (!slug) {
    if (req.method === "GET") {
      const rows = await db.select({ slug: aboutPages.slug, label: aboutPages.label }).from(aboutPages).orderBy(asc(aboutPages.createdAt));
      return res.json(rows);
    }
    if (req.method === "POST") {
      try {
        await requireAdmin(req);
        if (!body.slug || !body.label) return res.status(400).json({ error: "slug and label required" });
        const inserted = await db.insert(aboutPages).values({ slug: body.slug, label: body.label.trim() }).returning({ slug: aboutPages.slug, label: aboutPages.label });
        return res.status(201).json(inserted[0]);
      } catch (e: any) {
        if (e.message?.includes("unique") || e.message?.includes("duplicate")) return res.status(409).json({ error: "Slug already exists" });
        return res.status(e.status ?? 500).json({ error: e.message });
      }
    }
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (req.method === "DELETE") {
    try {
      await requireAdmin(req);
      await db.delete(aboutPages).where(eq(aboutPages.slug, slug));
      return res.json({ ok: true });
    } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
  }
  return res.status(405).json({ error: "Method not allowed" });
}

// /api/send-email
const VALID_TEMPLATES: EmailTemplate[] = ["donation_receipt", "application_received", "event_confirmation", "event_cancelled", "test"];
async function handleSendEmail(req: VercelRequest, res: VercelResponse, body: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!body.template || !VALID_TEMPLATES.includes(body.template)) return res.status(400).json({ error: "Invalid template" });
  if (!body.to || !isEmail(body.to)) return res.status(400).json({ error: "Invalid recipient" });
  if (body.template === "test") {
    try { await requireAdmin(req); } catch (e: any) { return res.status(e.status ?? 401).json({ error: e.message }); }
  }
  try {
    await sendTransactional(body.to, body.template as EmailTemplate, body.data || {}, { notifyType: body.notifyType });
    return res.json({ ok: true });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
}

// /api/admin/file-cleanup
const MANAGED_PREFIXES = ["site-images/", "site-documents/"];
const PINNED_PATHNAMES = new Set(["site-images/email-logo.png"]);

async function listAllManagedBlobs() {
  const all: Awaited<ReturnType<typeof list>>["blobs"] = [];
  for (const prefix of MANAGED_PREFIXES) {
    let cursor: string | undefined;
    while (true) {
      const result = await list({ prefix, token: process.env.BLOB_READ_WRITE_TOKEN!, cursor, limit: 1000 });
      all.push(...result.blobs);
      if (!result.hasMore) break;
      cursor = result.cursor;
    }
  }
  return all;
}

function collectUrls(value: unknown, out: Set<string>): void {
  if (typeof value === "string") { if (value.includes(".blob.vercel-storage.com/")) out.add(value); }
  else if (Array.isArray(value)) { for (const item of value) collectUrls(item, out); }
  else if (value !== null && typeof value === "object") { for (const v of Object.values(value)) collectUrls(v, out); }
}

async function handleFileCleanup(req: VercelRequest, res: VercelResponse) {
  try {
    await requireAdmin(req);
    if (req.method === "GET") {
      const [blobs, referencedUrls] = await Promise.all([
        listAllManagedBlobs(),
        (async () => {
          const urls = new Set<string>();
          const [allPages, allEvents] = await Promise.all([
            db.select({ content: pages.content }).from(pages),
            db.select({ heroImage: events.heroImage, gallery: events.gallery, documents: events.documents, pageContent: events.pageContent }).from(events),
          ]);
          for (const p of allPages) collectUrls(p.content, urls);
          for (const e of allEvents) { if (e.heroImage) urls.add(e.heroImage); collectUrls(e.gallery, urls); collectUrls(e.documents, urls); collectUrls(e.pageContent, urls); }
          return urls;
        })(),
      ]);
      const orphaned = blobs.filter((b) => !referencedUrls.has(b.url) && !PINNED_PATHNAMES.has(b.pathname));
      return res.json({ orphaned });
    }
    if (req.method === "DELETE") {
      const { urls } = req.body as { urls: string[] };
      if (!Array.isArray(urls) || urls.length === 0) return res.status(400).json({ error: "urls must be a non-empty array" });
      await del(urls, { token: process.env.BLOB_READ_WRITE_TOKEN! });
      return res.json({ deleted: urls.length });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) { return res.status(e.status ?? 500).json({ error: e.message }); }
}

// ─── Main dispatcher ─────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const [resource, ...rest] = parsePath(req);

  // Upload routes must be dispatched BEFORE reading body (stream must be intact)
  if (resource === "upload") {
    return handleUpload(req, res, rest[0]);
  }

  // Parse JSON body for all other routes
  let body: any = {};
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    body = await parseJson(req);
  }

  // File cleanup uses req.body after parseJson
  if (resource === "admin" && rest[0] === "file-cleanup") {
    req.body = body;
    return handleFileCleanup(req, res);
  }

  switch (resource) {
    case "events":           return handleEvents(req, res, body, rest);
    case "applications":     return handleApplications(req, res, body, rest);
    case "donations":        return handleDonations(req, res, body, rest);
    case "admins":           return handleAdmins(req, res, body, rest);
    case "event-submissions": return handleEventSubmissions(req, res, body, rest);
    case "paypal":           return handlePaypal(req, res, body, rest);
    case "pages":            return handlePages(req, res, body, rest);
    case "feature-roadmap":  return handleFeatureRoadmap(req, res, body, rest);
    case "about-pages":      return handleAboutPages(req, res, body, rest);
    case "send-email":       return handleSendEmail(req, res, body);
    default:                 return res.status(404).json({ error: "Not found" });
  }
}
