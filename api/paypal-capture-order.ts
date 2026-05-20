import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, donations, eq } from "./_helpers/db";
import { sendTransactional } from "./_helpers/email";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Missing PayPal credentials");
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body as {
      orderId?: string;
      donorName?: string;
      donorEmail?: string;
      feesCovered?: number;
      source?: "paypal" | "venmo";
    };

    if (!body.orderId) return res.status(400).json({ error: "Missing orderId" });

    const token = await getAccessToken();
    const capRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${body.orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

    const capture = await capRes.json();
    if (!capRes.ok) return res.status(500).json({ error: "Capture failed", detail: capture });

    const pu = capture.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];
    const payer = capture.payer ?? {};
    const amount = parseFloat(cap?.amount?.value ?? "0");
    const fees = parseFloat(cap?.seller_receivable_breakdown?.paypal_fee?.value ?? "0");
    const net = parseFloat(
      cap?.seller_receivable_breakdown?.net_amount?.value ?? `${amount - fees}`,
    );

    const donorName =
      body.donorName ||
      [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(" ");
    const donorEmail = body.donorEmail || payer.email_address || null;

    const ps = capture.payment_source ?? {};
    const capPs = (cap as any)?.payment_source ?? {};
    const walletBrand = String(ps?.wallet?.brand ?? capPs?.wallet?.brand ?? "").toLowerCase();
    const isVenmo = !!ps?.venmo || !!capPs?.venmo || walletBrand === "venmo";
    const source = body.source ?? (isVenmo ? "venmo" : "paypal");

    const inserted = await db
      .insert(donations)
      .values({
        source,
        donorName: donorName || null,
        donorEmail,
        amount: amount.toString(),
        feesCovered: (body.feesCovered ?? 0).toString(),
        netAmount: net.toString(),
        currency: cap?.amount?.currency_code ?? "USD",
        paypalOrderId: capture.id,
        paypalCaptureId: cap?.id ?? null,
        payerId: payer.payer_id ?? null,
        status: cap?.status === "COMPLETED" ? "completed" : "pending",
        capturedAt: cap?.create_time ? new Date(cap.create_time) : new Date(),
        rawPayload: capture,
      })
      .returning({ id: donations.id });

    const donationId = inserted[0]?.id ?? null;
    const hasContact = !!(donorName && donorEmail);

    if (hasContact && donationId) {
      try {
        await sendTransactional(donorEmail!, "donation_receipt", {
          donorName,
          amount,
          feesCovered: body.feesCovered ?? 0,
        }, { notifyType: "donations" });

        await db
          .update(donations)
          .set({ thankedAt: new Date() })
          .where(eq(donations.id, donationId));
      } catch (e) {
        console.warn("Receipt send failed:", e);
      }
    }

    return res.json({
      ok: true,
      captureId: cap?.id,
      amount,
      donorName,
      donorEmail,
      donationId,
      needsContact: !hasContact,
    });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}
