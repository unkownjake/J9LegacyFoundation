import type { VercelRequest, VercelResponse } from "@vercel/node";
import { renderTemplate, sendTransactional, type EmailTemplate, type NotifyType } from "./_helpers/email";
import { requireAdmin } from "./_helpers/auth";

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const VALID_TEMPLATES: EmailTemplate[] = [
  "donation_receipt",
  "application_received",
  "event_confirmation",
  "event_cancelled",
  "test",
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const json = (b: unknown, status = 200) => res.status(status).json(b);

  try {
    const body = req.body as {
      template?: string;
      to?: string;
      data?: Record<string, unknown>;
      notifyType?: NotifyType;
    };

    if (!body.template || !VALID_TEMPLATES.includes(body.template as EmailTemplate)) {
      return json({ error: "Invalid template" }, 400);
    }
    if (!body.to || !isEmail(body.to)) {
      return json({ error: "Invalid recipient" }, 400);
    }

    const template = body.template as EmailTemplate;

    // test template is admin-only
    if (template === "test") {
      try {
        await requireAdmin(req);
      } catch (e: any) {
        return json({ error: e.message }, e.status ?? 401);
      }
    }

    await sendTransactional(body.to, template, body.data || {}, {
      notifyType: body.notifyType,
    });

    return json({ ok: true });
  } catch (e) {
    console.error("send-email error:", e);
    return json({ error: (e as Error).message }, 500);
  }
}
