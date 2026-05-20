import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import type { DonatePageContent } from "@/lib/types/donate";

type Method = "paypal-checkout" | "zelle";

interface Props {
  content: DonatePageContent;
  /** When true, button clicks/external links/PayPal SDK are suppressed (admin preview). */
  preview?: boolean;
}

const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const METHOD_LABELS: Record<Method, string> = {
  "paypal-checkout": "PayPal / Card",
  zelle: "Zelle",
};

interface SuccessInfo {
  amount: number;
  donorName?: string;
}

export default function DonationWorkflow({ content, preview = false }: Props) {
  const enabledMethods = useMemo(() => {
    const list: Method[] = [];
    if (content.paypalCheckout?.enabled && content.paypalCheckout?.clientId) {
      list.push("paypal-checkout");
    }
    if (content.zelle.enabled) list.push("zelle");
    return list;
  }, [content]);

  const [method, setMethod] = useState<Method>(enabledMethods[0] ?? "paypal-checkout");
  const [amount, setAmount] = useState<string>(content.defaultAmount || "25");
  const [customAmount, setCustomAmount] = useState("50");
  const [coverFees, setCoverFees] = useState(true);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [receiptModal, setReceiptModal] = useState<{
    donationId: string;
    name: string;
    email: string;
  } | null>(null);

  const baseAmount = () =>
    amount === "custom" ? parseFloat(customAmount) || 0 : parseFloat(amount) || 0;
  const feeSurcharge = () => (coverFees ? +(baseAmount() * (content.feePercent / 100)).toFixed(2) : 0);
  const finalAmount = () => +(baseAmount() + feeSurcharge()).toFixed(2);

  const presets = [...content.amounts, "custom"];

  // Success state — replaces the form so users don't accidentally double-donate.
  if (success) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border max-w-3xl md:w-1/2">
        <div className="text-center py-6">
          <div className="text-5xl mb-3">💙</div>
          <h2 className="text-2xl font-bold text-primary-darker mb-2">
            Thank you{success.donorName ? `, ${success.donorName}` : ""}!
          </h2>
          <p className="text-foreground/80 mb-1">
            Your donation of <strong>${success.amount.toFixed(2)}</strong> was received.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Your support helps us continue J9's legacy.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-sm text-accent hover:underline"
          >
            Make another donation
          </button>
        </div>
        {receiptModal && (
          <ReceiptModal initial={receiptModal} onClose={() => setReceiptModal(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border max-w-3xl md:w-1/2">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary-darker">Make a Donation</h2>

      <div className="mb-4">
        <label className="block font-semibold mb-2">Choose a payment method:</label>
        <div className="flex flex-wrap gap-3">
          {enabledMethods.map((m) => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="method"
                value={m}
                checked={method === m}
                onChange={() => setMethod(m)}
                className="accent-accent"
              />
              <span
                className={`border rounded-md py-1.5 px-3 text-sm font-medium inline-flex items-center gap-2 ${
                  method === m ? "border-accent text-accent" : "border-muted text-foreground/80"
                }`}
              >
                {METHOD_LABELS[m]}
                {m === "paypal-checkout" && (
                  <span className="text-[10px] uppercase tracking-wide bg-accent text-accent-foreground rounded-full px-2 py-0.5 font-semibold">
                    Recommended
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
        {method === "paypal-checkout" && (
          <p className="text-xs text-muted-foreground mt-2">
            PayPal accepts credit/debit cards — no account required. On mobile, you can also pay with Venmo.
          </p>
        )}
      </div>

      {method === "zelle" ? (
        <div className="mb-4">
          <label className="block font-semibold mb-2">Donate via Zelle</label>
          <p className="mb-1 text-sm">Find us on Zelle at:</p>
          <p className="font-mono mb-4 text-accent">
            <strong>{content.zelle.email}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Please leave your <strong>name</strong> and <strong>email</strong> in the note so we can
            send you a receipt.
          </p>
          <button
            type="button"
            onClick={() => !preview && window.open("https://www.zellepay.com/", "_blank")}
            className="mt-4 w-full bg-accent text-accent-foreground font-semibold px-4 py-3 rounded-lg hover:bg-accent-lighter transition"
          >
            Take me to Zelle
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block font-semibold mb-2">Choose your donation amount:</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {presets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                    amount === amt
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-white border-muted hover:bg-muted/40"
                  }`}
                >
                  {amt === "custom" ? "Custom" : `$${amt}`}
                </button>
              ))}
            </div>
            {amount === "custom" && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full border rounded px-3 py-2 pl-7"
                />
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={coverFees}
                onCheckedChange={(v) => setCoverFees(!!v)}
                className="border-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground data-[state=checked]:border-accent"
              />
              I would like to cover the transaction fees (adds {content.feePercent}%)
            </label>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            We'll ask for your name and email after payment if you'd like a receipt.
          </p>

          <PaypalCheckoutButton
            content={content}
            preview={preview}
            amount={finalAmount()}
            feesCovered={feeSurcharge()}
            onSuccess={(res) => {
              setSuccess({ amount: finalAmount(), donorName: res.donorName });
              toast.success("Donation received — thank you!");
              if (res.needsContact && res.donationId) {
                setReceiptModal({
                  donationId: res.donationId,
                  name: res.donorName || "",
                  email: res.donorEmail || "",
                });
              }
            }}
          />
        </>
      )}

      {receiptModal && (
        <ReceiptModal initial={receiptModal} onClose={() => setReceiptModal(null)} />
      )}
    </div>
  );
}

interface CaptureResult {
  donationId?: string;
  donorName?: string;
  donorEmail?: string;
  needsContact?: boolean;
}

interface PaypalCheckoutProps {
  content: DonatePageContent;
  preview: boolean;
  amount: number;
  feesCovered: number;
  onSuccess: (res: CaptureResult) => void;
}

function PaypalCheckoutButton({
  content,
  preview,
  amount,
  feesCovered,
  onSuccess,
}: PaypalCheckoutProps) {
  const cfg = content.paypalCheckout;
  if (preview) {
    return (
      <div className="w-full text-center py-4 border-2 border-dashed rounded-lg text-sm text-muted-foreground">
        PayPal Smart Buttons render here
      </div>
    );
  }
  if (!cfg.clientId) {
    return (
      <div className="w-full text-center py-4 border-2 border-dashed rounded-lg text-sm text-destructive">
        PayPal client ID not configured. Add it in admin → Donate → Payment settings.
      </div>
    );
  }
  if (amount <= 0) {
    return (
      <div className="w-full text-center py-4 border-2 border-dashed rounded-lg text-sm text-muted-foreground">
        Enter an amount to continue.
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: cfg.clientId,
        currency: "USD",
        intent: "capture",
        components: "buttons",
        "enable-funding": "venmo",
        "disable-funding": "paylater,credit",
      }}
    >
      <PayPalButtons
        key={`${cfg.clientId}-${amount}`}
        style={{ layout: "vertical", color: "gold", shape: "rect", label: "donate" }}
        disabled={amount <= 0}
        createOrder={async () => {
          const res = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, feesCovered }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.id) {
            toast.error("Could not start PayPal checkout");
            throw new Error(data?.error ?? "create-order failed");
          }
          return data.id;
        }}
        onApprove={async (data) => {
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.orderID,
              feesCovered,
            }),
          });
          const result = await res.json().catch(() => ({}));
          if (!res.ok || !result?.ok) {
            toast.error("Payment could not be captured");
            return;
          }
          onSuccess({
            donationId: result.donationId,
            donorName: result.donorName,
            donorEmail: result.donorEmail,
            needsContact: result.needsContact,
          });
        }}
        onError={(err) => {
          console.error("PayPal error", err);
          toast.error("PayPal error — please try again");
        }}
      />
    </PayPalScriptProvider>
  );
}

interface ReceiptModalProps {
  initial: { donationId: string; name: string; email: string };
  onClose: () => void;
}

function ReceiptModal({ initial, onClose }: ReceiptModalProps) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const handleSend = async () => {
    if (!name.trim() || !email.trim()) return;
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/donations/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donationId: initial.donationId,
        donorName: name.trim(),
        donorEmail: email.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok || !data?.ok) {
      toast.error("Could not send receipt — please try again");
      return;
    }
    toast.success("Receipt sent! Check your email.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => !submitting && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/40 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <h3 className="text-xl font-bold text-primary-darker mb-2 pr-8">Thank you for your gift! 💙</h3>
        <p className="text-sm text-foreground/80 mb-4">
          Would you like an emailed receipt? Just confirm your name and email below.
        </p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block font-semibold mb-1 text-sm">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 border-muted"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-sm">Your Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(
                  e.target.value && !validateEmail(e.target.value)
                    ? "Please enter a valid email address"
                    : "",
                );
              }}
              className={`w-full border rounded px-3 py-2 ${emailError ? "border-destructive" : "border-muted"}`}
              placeholder="Enter your email"
            />
            {emailError && <p className="text-destructive text-xs mt-1">{emailError}</p>}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-muted hover:bg-muted/40"
          >
            No thanks
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={submitting || !name.trim() || !email.trim() || !!emailError}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent-lighter disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send receipt"}
          </button>
        </div>
      </div>
    </div>
  );
}
