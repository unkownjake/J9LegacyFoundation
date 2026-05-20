import nodemailer from "nodemailer";
import { createClerkClient } from "@clerk/backend";
import { db, adminNotificationPrefs } from "./db";
import { eq } from "drizzle-orm";

// NOTE: email-logo.png is required — embedded in all transactional emails. Do not delete from Vercel Blob.
const LOGO_URL =
  "https://oqscstxo6osyjlsa.public.blob.vercel-storage.com/site-images/email-logo.png";

export type EmailTemplate =
  | "donation_receipt"
  | "application_received"
  | "event_confirmation"
  | "event_cancelled"
  | "test";

export type NotifyType = "applications" | "donations" | "event_submissions";

function escape(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function money(n: unknown): string {
  const v = Number(n);
  return Number.isFinite(v) ? `$${v.toFixed(2)}` : "$0.00";
}

function wrap(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;background:#0a2540;text-align:left;">
          <img src="${LOGO_URL}" alt="J9 Legacy Foundation" width="280" style="display:block;height:auto;max-width:100%;border:0;outline:none;text-decoration:none;" />
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#0a2540;">${escape(title)}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#666;text-align:center;">
          J9 Legacy Foundation · <a href="https://j9legacy.org" style="color:#0a2540;">j9legacy.org</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

export function renderTemplate(
  template: EmailTemplate,
  data: Record<string, unknown>,
): { subject: string; html: string; text: string } {
  if (template === "test") {
    const name = escape(data.name || "Admin");
    const subject = "J9 Legacy — test email ✓";
    const html = wrap(
      "Test email ✓",
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hi ${name},</p>
       <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">This is a test email from the J9 Legacy admin dashboard. If you can read this with the logo and branding above, the Gmail SMTP integration is working correctly.</p>
       <p style="margin:0 0 12px;font-size:14px;color:#555;">Sent at ${new Date().toISOString()}.</p>
       <p style="margin:16px 0 0;font-size:15px;line-height:1.6;">— The J9 Legacy Foundation team</p>`,
    );
    const text = `Hi ${data.name || "Admin"},\n\nThis is a test email from the J9 Legacy admin dashboard. The Gmail SMTP integration is working.\n\nSent at ${new Date().toISOString()}.\n\n— The J9 Legacy Foundation team`;
    return { subject, html, text };
  }
  if (template === "donation_receipt") {
    const name = escape(data.donorName || "Friend");
    const amount = money(data.amount);
    const fees = Number(data.feesCovered) > 0 ? money(data.feesCovered) : null;
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const subject = "Thank You for Your Donation to J9 Legacy Foundation";
    const html = wrap(
      "Thank you for your donation",
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Dear ${name},</p>
       <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Thank you for your generous donation of <strong>${amount}</strong> to the J9 Legacy Foundation on ${escape(date)}.</p>
       ${fees ? `<p style="margin:0 0 12px;font-size:14px;color:#555;">Including ${fees} to cover processing fees — thank you for that extra generosity.</p>` : ""}
       <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">The J9 Legacy Foundation was started to honor the memory of Jacob Eshenbaugh, who passed away in May of 2024. As a child, summer camps were an important and impactful part of his life, therefore, to continue his legacy the Foundation is working to help youth, and their families experience things that were so meaningful to him. Your support helps the Foundation empower youth and families by providing financial support for camp attendance and organizing community events that enhance access to educational and recreational opportunities.</p>
       <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">No goods or services were provided in exchange, making your contribution fully tax deductible. Thank you for your support in keeping Jacob's spirit alive and helping kids and families in need.</p>
       <p style="margin:16px 0 0;font-size:15px;line-height:1.6;">With gratitude,<br/>Naomi Maxey<br/>President</p>`,
    );
    const text = `Dear ${data.donorName || "Friend"},\n\nThank you for your generous donation of ${amount} to the J9 Legacy Foundation on ${date}.\n\nThe J9 Legacy Foundation was started to honor the memory of Jacob Eshenbaugh, who passed away in May of 2024. As a child, summer camps were an important and impactful part of his life, therefore, to continue his legacy the Foundation is working to help youth, and their families experience things that were so meaningful to him. Your support helps the Foundation empower youth and families by providing financial support for camp attendance and organizing community events that enhance access to educational and recreational opportunities.\n\nNo goods or services were provided in exchange, making your contribution fully tax deductible. Thank you for your support in keeping Jacob's spirit alive and helping kids and families in need.\n\nWith gratitude,\nNaomi Maxey\nPresident`;
    return { subject, html, text };
  }
  if (template === "application_received") {
    const name = escape(data.applicantName || "Applicant");
    const subject = "We received your sponsorship application";
    const html = wrap(
      "Application received ✓",
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hi ${name},</p>
       <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Thanks for applying to the J9 Legacy sponsorship program. We've received your application and will review it carefully.</p>
       <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">You'll hear back from us by email once a decision has been made. If anything comes up before then, just reply to this email.</p>
       <p style="margin:16px 0 0;font-size:15px;line-height:1.6;">— The J9 Legacy Foundation team</p>`,
    );
    const text = `Hi ${data.applicantName || "Applicant"},\n\nWe received your sponsorship application and will review it carefully. You'll hear back by email.\n\n— The J9 Legacy Foundation team`;
    return { subject, html, text };
  }
  if (template === "event_confirmation") {
    const name = escape(data.submitterName || "Friend");
    const eventTitle = escape(data.eventTitle || "the event");
    const when = escape(data.eventWhen || "");
    const where = escape(data.eventWhere || "");
    const isRsvp = data.eventType === "rsvp";
    const headcount = Number(data.headcount) || 1;
    const amount = Number(data.amount) || 0;
    const manageUrl = typeof data.manageUrl === "string" ? data.manageUrl : "";
    const paymentLine =
      amount > 0
        ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Amount: <strong>${money(amount)}</strong>${data.paymentMethod === "in_person" ? " — to be paid in person" : ""}.</p>`
        : "";
    const manageBlock = manageUrl
      ? `<div style="margin:24px 0;padding:16px;background:#f5f7fa;border:1px solid #e3e8ef;border-radius:8px;">
           <p style="margin:0 0 8px;font-size:14px;color:#0a2540;"><strong>Need to make changes?</strong></p>
           <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#444;">Use the link below to view or cancel your ${isRsvp ? "RSVP" : "registration"} at any time. Save it somewhere safe.</p>
           <p style="margin:0;"><a href="${escape(manageUrl)}" style="display:inline-block;background:#0a2540;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Manage your ${isRsvp ? "RSVP" : "registration"}</a></p>
           <p style="margin:10px 0 0;font-size:12px;color:#777;word-break:break-all;">${escape(manageUrl)}</p>
         </div>`
      : "";
    const subject = isRsvp
      ? `You're RSVP'd for ${data.eventTitle || "the event"}`
      : `You're registered for ${data.eventTitle || "the event"}`;
    const html = wrap(
      isRsvp ? "RSVP confirmed ✓" : "Registration confirmed ✓",
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hi ${name},</p>
       <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">You're confirmed for <strong>${eventTitle}</strong>${headcount > 1 ? ` (party of ${headcount})` : ""}.</p>
       ${when ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>When:</strong> ${when}</p>` : ""}
       ${where ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;"><strong>Where:</strong> ${where}</p>` : ""}
       ${paymentLine}
       ${manageBlock}
       <p style="margin:16px 0 0;font-size:15px;line-height:1.6;">See you there!<br/>— The J9 Legacy Foundation team</p>`,
    );
    const text = `Hi ${data.submitterName || "Friend"},\n\nYou're confirmed for ${data.eventTitle || "the event"}.\n${when ? `When: ${data.eventWhen}\n` : ""}${where ? `Where: ${data.eventWhere}\n` : ""}${amount > 0 ? `Amount: ${money(amount)}\n` : ""}${manageUrl ? `\nManage your ${isRsvp ? "RSVP" : "registration"}: ${manageUrl}\n` : ""}\nSee you there!\n— The J9 Legacy Foundation team`;
    return { subject, html, text };
  }
  if (template === "event_cancelled") {
    const name = escape(data.submitterName || "Friend");
    const eventTitle = escape(data.eventTitle || "the event");
    const isRsvp = data.eventType === "rsvp";
    const subject = `Cancellation confirmed — ${data.eventTitle || "event"}`;
    const html = wrap(
      "Cancellation confirmed",
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hi ${name},</p>
       <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Your ${isRsvp ? "RSVP" : "registration"} for <strong>${eventTitle}</strong> has been cancelled. You're no longer on the list.</p>
       <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">If this was a mistake, just reply to this email and we'll help sort it out. Otherwise, we hope to see you at a future event.</p>
       <p style="margin:16px 0 0;font-size:15px;line-height:1.6;">— The J9 Legacy Foundation team</p>`,
    );
    const text = `Hi ${data.submitterName || "Friend"},\n\nYour ${isRsvp ? "RSVP" : "registration"} for ${data.eventTitle || "the event"} has been cancelled.\n\nIf this was a mistake, reply to this email.\n\n— The J9 Legacy Foundation team`;
    return { subject, html, text };
  }
  throw new Error(`Unknown template: ${template}`);
}

export async function resolveAdminBcc(notifyType: NotifyType): Promise<string[]> {
  try {
    const col =
      notifyType === "applications"
        ? adminNotificationPrefs.notifyApplications
        : notifyType === "donations"
          ? adminNotificationPrefs.notifyDonations
          : adminNotificationPrefs.notifyEventSubmissions;

    const prefs = await db
      .select({ userId: adminNotificationPrefs.userId })
      .from(adminNotificationPrefs)
      .where(eq(col, true));

    if (prefs.length === 0) return [];

    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    const emails: string[] = [];
    for (const pref of prefs) {
      try {
        const user = await clerk.users.getUser(pref.userId);
        const email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress;
        if (email) emails.push(email);
      } catch {
        // skip users that no longer exist
      }
    }
    return emails;
  } catch (e) {
    console.warn("Failed to resolve admin BCC list:", e);
    return [];
  }
}

export interface SendOptions {
  notifyType?: NotifyType;
}

export async function sendTransactional(
  to: string,
  template: EmailTemplate,
  data: Record<string, unknown>,
  options: SendOptions = {},
): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const fromAddr = process.env.GMAIL_FROM || user;
  const fromName = process.env.GMAIL_FROM_NAME || "J9 Legacy Foundation";
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || "";

  if (!user || !pass) throw new Error("Email not configured (missing GMAIL_USER/GMAIL_APP_PASSWORD)");

  const { subject, html, text } = renderTemplate(template, data);

  let bccList: string[] = [];
  if (options.notifyType) {
    bccList = await resolveAdminBcc(options.notifyType);
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `${fromName} <${fromAddr}>`,
    to,
    bcc: bccList.length > 0 ? bccList : undefined,
    replyTo: adminEmail || fromAddr,
    subject,
    text,
    html,
  });
}
