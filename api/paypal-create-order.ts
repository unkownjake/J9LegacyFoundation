import type { VercelRequest, VercelResponse } from "@vercel/node";

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
      amount?: number;
      feesCovered?: number;
      donorName?: string;
      donorEmail?: string;
    };

    const amount = Number(body.amount);
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const token = await getAccessToken();
    const orderRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: "J9 Legacy Foundation Donation",
            custom_id: JSON.stringify({
              donorName: body.donorName ?? "",
              donorEmail: body.donorEmail ?? "",
              feesCovered: body.feesCovered ?? 0,
            }).slice(0, 127),
            amount: { currency_code: "USD", value: amount.toFixed(2) },
          },
        ],
        application_context: {
          brand_name: "J9 Legacy Foundation",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
        },
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) return res.status(500).json({ error: "PayPal order failed", detail: order });

    return res.json({ id: order.id });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}
