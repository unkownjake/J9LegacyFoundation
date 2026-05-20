import { useEffect, useMemo, useRef, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventRecord } from "@/lib/types/events";
import type {
  FormField,
  FormSection,
  PricingTier,
  RegistrationForm,
} from "@/lib/types/registration";
import type { DonatePageContent } from "@/lib/types/donate";
import { getPageContent } from "@/lib/cms";
import { SYS_FIELD_IDS } from "@/lib/formSystemSections";

type Answers = Record<string, unknown>;

interface SubmissionResult {
  submissionId: string;
  magicToken: string;
  amount: number;
  paymentMethod: "free" | "in_person" | "paypal";
}

interface Props {
  event: EventRecord;
  onClose?: () => void;
  onSuccess?: (result: SubmissionResult) => void;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function fieldVisible(field: FormField, answers: Answers): boolean {
  if (!field.showIf) return true;
  const a = answers[field.showIf.fieldId];
  if (Array.isArray(a)) return a.includes(field.showIf.equals);
  return String(a ?? "") === field.showIf.equals;
}

function fieldHasValue(field: FormField, value: unknown): boolean {
  if (field.kind === "checkbox" || field.kind === "waiver") return value === true;
  if (field.kind === "multi_select") return Array.isArray(value) && value.length > 0;
  return value != null && String(value).trim() !== "";
}

function validateField(field: FormField, value: unknown): string | null {
  if (field.kind === "section_header") return null;
  const required = field.required || field.kind === "waiver";
  if (required && !fieldHasValue(field, value)) {
    return field.kind === "waiver" ? "You must agree to continue" : "Required";
  }
  if (field.kind === "email" && fieldHasValue(field, value) && !isEmail(String(value))) {
    return "Enter a valid email";
  }
  if (field.kind === "number" && fieldHasValue(field, value)) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "Enter a number";
  }
  return null;
}

export default function EventSubmissionForm({ event, onClose, onSuccess }: Props) {
  const tiers: PricingTier[] = event.pricing_tiers ?? [];
  const rawForm = event.registration_form ?? {};
  const form: RegistrationForm = { ...rawForm, sections: rawForm.sections ?? [] };

  // Tier selection (paid registration only)
  const requiresTierPick = event.event_type === "registration" && tiers.length > 0;
  const [tierId, setTierId] = useState<string>(requiresTierPick ? tiers[0].id : "");
  const tier = useMemo(() => tiers.find((t) => t.id === tierId) ?? null, [tiers, tierId]);

  // Computed amount
  const amount = useMemo(() => {
    if (event.event_type !== "registration") return 0;
    if (tier) return Number(tier.price) || 0;
    return Number(event.cost_amount) || 0;
  }, [event, tier]);

  // Team tier flag
  const isTeam = tier?.kind === "team";
  const [teamName, setTeamName] = useState("");
  useEffect(() => {
    if (!isTeam) setTeamName("");
  }, [isTeam]);

  // Submitter contact (always required up front)
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterPhone, setSubmitterPhone] = useState("");

  // Headcount: required for RSVP and team registrations.
  const headcountRequired = event.event_type === "rsvp" || isTeam;
  const [headcount, setHeadcount] = useState<string>(
    event.event_type === "rsvp" ? "1" : "",
  );

  // Form section navigation
  const [answers, setAnswers] = useState<Answers>({});
  const [sectionStack, setSectionStack] = useState<string[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(
    form.sections[0]?.id ?? null,
  );

  // Reset nav whenever the form definition changes
  useEffect(() => {
    setCurrentSectionId(form.sections[0]?.id ?? null);
    setSectionStack([]);
  }, [form]);

  const currentSection = form.sections.find((s) => s.id === currentSectionId) ?? null;

  // 4 stages: tier, contact, formSections, payment
  type Stage = "tier" | "contact" | "form" | "review" | "payment" | "done";
  const initialStage: Stage = requiresTierPick ? "tier" : "contact";
  const [stage, setStage] = useState<Stage>(initialStage);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  // Donate page content for PayPal client ID + environment (reused).
  const [paypalCfg, setPaypalCfg] = useState<{ clientId: string } | null>(null);
  useEffect(() => {
    if (event.event_type !== "registration" || amount <= 0) return;
    getPageContent<DonatePageContent>("donate")
      .then((d) => {
        if (d?.paypalCheckout?.clientId) {
          setPaypalCfg({ clientId: d.paypalCheckout.clientId });
        }
      })
      .catch(() => {});
  }, [event.event_type, amount]);

  function setAnswer(fieldId: string, value: unknown) {
    setAnswers((a) => ({ ...a, [fieldId]: value }));
    setErrors((e) => {
      const { [fieldId]: _drop, ...rest } = e;
      return rest;
    });
  }

  function validateContact(): boolean {
    const e: Record<string, string> = {};
    if (!submitterName.trim()) e.submitterName = "Required";
    if (!submitterEmail.trim()) e.submitterEmail = "Required";
    else if (!isEmail(submitterEmail)) e.submitterEmail = "Enter a valid email";
    if (isTeam && !teamName.trim()) e.teamName = "Team name is required";
    if (headcountRequired) {
      const n = Number(headcount);
      if (!Number.isFinite(n) || n < 1) {
        e.headcount = isTeam
          ? "Enter the number of teammates (at least 1)"
          : "Enter the number of people (at least 1)";
      } else if (isTeam) {
        const min = Number(tier?.rosterMin) || 0;
        const max = Number(tier?.rosterMax) || 0;
        if (min && n < min) e.headcount = `At least ${min} teammate${min === 1 ? "" : "s"}`;
        if (max && n > max) e.headcount = `At most ${max} teammates`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateSection(section: FormSection): boolean {
    const e: Record<string, string> = {};
    if (section.repeatPerTeammate && isTeam) {
      const n = Math.max(1, Number(headcount) || 1);
      for (let ti = 0; ti < n; ti++) {
        section.fields.forEach((f) => {
          if (!fieldVisible(f, answers)) return;
          const key = `${f.id}__${ti}`;
          const err = validateField(f, answers[key]);
          if (err) e[key] = err;
        });
      }
    } else {
      section.fields.forEach((f) => {
        if (!fieldVisible(f, answers)) return;
        const err = validateField(f, answers[f.id]);
        if (err) e[f.id] = err;
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextSectionIdFor(section: FormSection): string | "__submit__" {
    const rule = section.goTo ?? { kind: "next" };
    if (rule.kind === "submit") return "__submit__";
    if (rule.kind === "goto") return rule.sectionId;
    if (rule.kind === "branch") {
      const a = answers[rule.fieldId];
      const dest = (a != null && rule.branches[String(a)]) || rule.defaultSectionId;
      return dest ?? "__submit__";
    }
    // next — skip team-only sections when not a team registration
    let idx = form.sections.findIndex((s) => s.id === section.id);
    while (idx + 1 < form.sections.length) {
      idx += 1;
      const candidate = form.sections[idx];
      if (candidate.repeatPerTeammate && !isTeam) continue;
      return candidate.id;
    }
    return "__submit__";
  }

  function advanceFromForm() {
    if (!currentSection) {
      setStage("review");
      return;
    }
    if (!validateSection(currentSection)) return;
    const dest = nextSectionIdFor(currentSection);
    if (dest === "__submit__") {
      setStage("review");
      return;
    }
    setSectionStack((s) => [...s, currentSection.id]);
    setCurrentSectionId(dest);
  }

  function goBackInForm() {
    if (sectionStack.length === 0) {
      setStage(requiresTierPick ? "contact" : "contact");
      return;
    }
    const prev = sectionStack[sectionStack.length - 1];
    setSectionStack((s) => s.slice(0, -1));
    setCurrentSectionId(prev);
  }

  async function submitFinal(paymentMethod: "free" | "in_person" | "paypal") {
    setSubmitting(true);
    try {
      const headcountNum = headcountRequired ? Number(headcount) || 1 : 1;
      const res = await fetch("/api/event-submissions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          pricingTierId: tier?.id ?? null,
          paymentMethod,
          submitterName: submitterName.trim(),
          submitterEmail: submitterEmail.trim(),
          submitterPhone: submitterPhone.trim() || undefined,
          teamName: isTeam ? teamName.trim() : undefined,
          headcount: headcountNum,
          answers,
          siteOrigin: window.location.origin,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "Submission failed");
        return null;
      }
      const r: SubmissionResult = {
        submissionId: data.submissionId,
        magicToken: data.magicToken,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
      };
      setResult(r);
      return { ...r, paypalOrderId: data.paypalOrderId as string | null };
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNonPaypalSubmit(paymentMethod: "free" | "in_person") {
    const r = await submitFinal(paymentMethod);
    if (r) {
      setStage("done");
      onSuccess?.(r);
    }
  }

  if (stage === "done" && result) {
    return <DoneScreen result={result} event={event} onClose={onClose} />;
  }

  return (
    <div className="space-y-6">
      {/* Stage: tier */}
      {stage === "tier" && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-primary-darker">Select a registration option</h3>
          <div className="grid gap-2">
            {tiers.map((t) => (
              <label
                key={t.id}
                className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer transition ${
                  tierId === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  className="mt-1 accent-primary"
                  checked={tierId === t.id}
                  onChange={() => setTierId(t.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-sm font-semibold text-accent">
                      {Number(t.price) === 0 ? "Free" : `$${Number(t.price).toFixed(2).replace(/\.00$/, "")}`}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{t.description}</p>
                  )}
                  {t.kind === "team" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Team registration {t.rosterMin ? `· min ${t.rosterMin}` : ""}{" "}
                      {t.rosterMax ? `· max ${t.rosterMax}` : ""}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
          <FooterButtons onBack={onClose} backLabel="Cancel" onNext={() => setStage("contact")} disabled={!tierId} />
        </div>
      )}

      {/* Stage: contact (+ team roster) */}
      {stage === "contact" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary-darker">
            {isTeam ? "Captain & team details" : "Your details"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={isTeam ? "Captain name" : "Full name"} error={errors.submitterName} required>
              <Input value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} />
            </Field>
            <Field label="Email" error={errors.submitterEmail} required>
              <Input
                type="email"
                value={submitterEmail}
                onChange={(e) => setSubmitterEmail(e.target.value)}
              />
            </Field>
            <Field label="Phone (optional)">
              <Input value={submitterPhone} onChange={(e) => setSubmitterPhone(e.target.value)} />
            </Field>
            {isTeam && (
              <Field label="Team name" error={errors.teamName} required>
                <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
              </Field>
            )}
          </div>

          {headcountRequired && (
            <Field
              label={isTeam ? "Number of teammates" : "Number of people in your party"}
              error={errors.headcount}
              required
              helpText={
                isTeam
                  ? "Including the captain. We'll ask for each teammate's details next."
                  : "Including yourself."
              }
            >
              <Input
                type="number"
                min={1}
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
                className="max-w-[160px]"
              />
            </Field>
          )}

          <FooterButtons
            onBack={requiresTierPick ? () => setStage("tier") : onClose}
            backLabel={requiresTierPick ? "Back" : "Cancel"}
            onNext={() => {
              if (!validateContact()) return;
              if (form.sections.length > 0) setStage("form");
              else setStage("review");
            }}
          />
        </div>
      )}

      {/* Stage: form sections */}
      {stage === "form" && currentSection && (
        <div className="space-y-4">
          {currentSection.title && (
            <h3 className="text-lg font-semibold text-primary-darker">{currentSection.title}</h3>
          )}
          {currentSection.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {currentSection.description}
            </p>
          )}
          {currentSection.repeatPerTeammate && isTeam ? (
            <div className="space-y-6">
              {Array.from({ length: Math.max(1, Number(headcount) || 1) }).map((_, ti) => (
                <div key={ti} className="border rounded-md p-4 bg-muted/20 space-y-4">
                  <p className="text-sm font-semibold text-primary-darker">
                    Teammate {ti + 1}
                  </p>
                  {currentSection.fields
                    .filter((f) => fieldVisible(f, answers))
                    .map((f) => {
                      const key = `${f.id}__${ti}`;
                      return (
                        <FieldRenderer
                          key={key}
                          field={f}
                          value={answers[key]}
                          onChange={(v) => setAnswer(key, v)}
                          error={errors[key]}
                        />
                      );
                    })}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {currentSection.fields
                .filter((f) => fieldVisible(f, answers))
                .map((f) => (
                  <FieldRenderer
                    key={f.id}
                    field={f}
                    value={answers[f.id]}
                    onChange={(v) => setAnswer(f.id, v)}
                    error={errors[f.id]}
                  />
                ))}
            </div>
          )}
          <FooterButtons
            onBack={goBackInForm}
            backLabel="Back"
            onNext={advanceFromForm}
            nextLabel="Next"
          />
        </div>
      )}

      {/* Stage: review (final submit / payment selection) */}
      {stage === "review" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary-darker">Review &amp; submit</h3>
          <ReviewSummary
            event={event}
            tier={tier}
            amount={amount}
            submitterName={submitterName}
            submitterEmail={submitterEmail}
            teamName={isTeam ? teamName : null}
            headcount={headcountRequired ? Number(headcount) || 1 : null}
          />

          {amount > 0 ? (
            <PaymentChoice
              amount={amount}
              paypalCfg={paypalCfg}
              event={event}
              submitting={submitting}
              onPayInPerson={() => handleNonPaypalSubmit("in_person")}
              onPaypalCreate={async () => {
                const r = await submitFinal("paypal");
                if (!r?.paypalOrderId) {
                  throw new Error("Could not create order");
                }
                return r.paypalOrderId;
              }}
              onPaypalApprove={async (orderId) => {
                if (!result) return;
                const res = await fetch("/api/event-submissions/capture", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    submissionId: result.submissionId,
                    magicToken: result.magicToken,
                    orderId,
                    siteOrigin: window.location.origin,
                  }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data?.ok) {
                  toast.error(data?.error ?? "Payment capture failed");
                  return;
                }
                setStage("done");
                onSuccess?.(result);
              }}
            />
          ) : (
            <FooterButtons
              onBack={() =>
                form.sections.length > 0 ? setStage("form") : setStage("contact")
              }
              backLabel="Back"
              onNext={() => handleNonPaypalSubmit("free")}
              nextLabel={submitting ? "Submitting…" : event.event_type === "rsvp" ? "Confirm RSVP" : "Submit"}
              disabled={submitting}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FooterButtons({
  onBack,
  backLabel,
  onNext,
  nextLabel = "Next",
  disabled,
}: {
  onBack?: () => void;
  backLabel?: string;
  onNext: () => void;
  nextLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2 border-t mt-2">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          {backLabel ?? "Back"}
        </Button>
      ) : (
        <span />
      )}
      <Button type="button" onClick={onNext} disabled={disabled}>
        {nextLabel}
      </Button>
    </div>
  );
}

function Field({
  label,
  error,
  required,
  children,
  helpText,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  helpText?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  if (field.kind === "section_header") {
    return (
      <div className="border-l-4 border-primary/40 pl-3 py-1">
        <p className="font-semibold text-primary-darker">{field.label}</p>
        {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
      </div>
    );
  }
  if (field.kind === "waiver") {
    return (
      <div className="border rounded-md p-3 space-y-2 bg-muted/30">
        <p className="font-medium text-sm">{field.label}</p>
        {field.waiverHtml && (
          <div
            className="text-xs text-foreground/80 max-h-48 overflow-auto bg-white border rounded p-2 prose prose-sm"
            dangerouslySetInnerHTML={{ __html: field.waiverHtml }}
          />
        )}
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={value === true}
            onCheckedChange={(v) => onChange(v === true)}
          />
          <span>{field.waiverAgreeLabel ?? "I agree"}</span>
        </label>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
  return (
    <Field label={field.label} error={error} required={field.required} helpText={field.helpText}>
      {field.kind === "short_text" && (
        <Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
      )}
      {field.kind === "long_text" && (
        <Textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
        />
      )}
      {field.kind === "email" && (
        <Input
          type="email"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}
      {field.kind === "phone" && (
        <Input
          type="tel"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}
      {field.kind === "number" && (
        <Input
          type="number"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}
      {field.kind === "date" && (
        <Input type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.kind === "select" && (
        <Select value={String(value ?? "")} onValueChange={(v) => onChange(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose…" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {field.kind === "multi_select" && (
        <div className="space-y-1">
          {(field.options ?? []).map((opt) => {
            const arr = Array.isArray(value) ? (value as string[]) : [];
            const checked = arr.includes(opt.id);
            return (
              <label key={opt.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => {
                    const next = v === true ? [...arr, opt.id] : arr.filter((x) => x !== opt.id);
                    onChange(next);
                  }}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      )}
      {field.kind === "checkbox" && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={value === true} onCheckedChange={(v) => onChange(v === true)} />
          {field.placeholder ?? "Yes"}
        </label>
      )}
    </Field>
  );
}

function ReviewSummary({
  event,
  tier,
  amount,
  submitterName,
  submitterEmail,
  teamName,
  headcount,
}: {
  event: EventRecord;
  tier: PricingTier | null;
  amount: number;
  submitterName: string;
  submitterEmail: string;
  teamName: string | null;
  headcount: number | null;
}) {
  return (
    <div className="border rounded-md p-4 bg-muted/30 text-sm space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Event</span>
        <span className="font-medium">{event.title}</span>
      </div>
      {tier && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Option</span>
          <span className="font-medium">{tier.name}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted-foreground">{teamName ? "Captain" : "Name"}</span>
        <span className="font-medium">{submitterName}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Email</span>
        <span className="font-medium">{submitterEmail}</span>
      </div>
      {teamName && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Team</span>
          <span className="font-medium">{teamName}</span>
        </div>
      )}
      {headcount != null && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">{teamName ? "Teammates" : "Headcount"}</span>
          <span className="font-medium">{headcount}</span>
        </div>
      )}
      <div className="flex justify-between border-t pt-2">
        <span className="text-muted-foreground">Total</span>
        <span className="font-semibold text-accent">
          {amount > 0 ? `$${amount.toFixed(2).replace(/\.00$/, "")}` : "Free"}
        </span>
      </div>
    </div>
  );
}

function PaymentChoice({
  amount,
  paypalCfg,
  event,
  submitting,
  onPayInPerson,
  onPaypalCreate,
  onPaypalApprove,
}: {
  amount: number;
  paypalCfg: { clientId: string } | null;
  event: EventRecord;
  submitting: boolean;
  onPayInPerson: () => void;
  onPaypalCreate: () => Promise<string>;
  onPaypalApprove: (orderId: string) => Promise<void>;
}) {
  const [method, setMethod] = useState<"paypal" | "in_person">(paypalCfg ? "paypal" : "in_person");
  const [capturing, setCapturing] = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">How would you like to pay?</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {paypalCfg && (
          <label
            className={`border rounded-md p-3 cursor-pointer ${
              method === "paypal" ? "border-primary bg-primary/5" : "hover:bg-muted/40"
            }`}
          >
            <input
              type="radio"
              name="pay"
              className="mr-2 accent-primary"
              checked={method === "paypal"}
              onChange={() => setMethod("paypal")}
            />
            <span className="font-medium">Pay online (PayPal / card)</span>
          </label>
        )}
        <label
          className={`border rounded-md p-3 cursor-pointer ${
            method === "in_person" ? "border-primary bg-primary/5" : "hover:bg-muted/40"
          }`}
        >
          <input
            type="radio"
            name="pay"
            className="mr-2 accent-primary"
            checked={method === "in_person"}
            onChange={() => setMethod("in_person")}
          />
          <span className="font-medium">Pay in person</span>
          {event.payment_note && (
            <p className="text-xs text-muted-foreground mt-1">{event.payment_note}</p>
          )}
        </label>
      </div>

      {method === "paypal" && paypalCfg && (
        <div className="relative">
          {capturing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80 rounded-md">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing payment…</p>
            </div>
          )}
          <PayPalScriptProvider
            options={{
              clientId: paypalCfg.clientId,
              currency: "USD",
              intent: "capture",
              components: "buttons",
              "disable-funding": "credit,paylater,venmo",
            }}
          >
            <PayPalButtons
              key={`${paypalCfg.clientId}-${amount}`}
              style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
              createOrder={async () => onPaypalCreate()}
              onApprove={async (data) => {
                setCapturing(true);
                try {
                  await onPaypalApprove(data.orderID);
                } finally {
                  setCapturing(false);
                }
              }}
              onError={(err) => {
                console.error(err);
                toast.error("PayPal error — please try again");
              }}
            />
          </PayPalScriptProvider>
        </div>
      )}

      {method === "in_person" && (
        <Button
          type="button"
          onClick={onPayInPerson}
          disabled={submitting}
          className="w-full bg-accent text-accent-foreground hover:bg-accent-lighter"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Submit (pay $${amount.toFixed(2).replace(/\.00$/, "")} in person)`}
        </Button>
      )}
    </div>
  );
}

function DoneScreen({
  result,
  event,
  onClose,
}: {
  result: SubmissionResult;
  event: EventRecord;
  onClose?: () => void;
}) {
  return (
    <div className="space-y-4 text-center">
      <h3 className="text-xl font-bold text-primary-darker">You're all set! 🎉</h3>
      <p className="text-sm text-muted-foreground">
        Your {event.event_type === "rsvp" ? "RSVP" : "registration"} for <strong>{event.title}</strong> has been received.
      </p>
      {result.paymentMethod === "in_person" && result.amount > 0 && (
        <p className="text-sm">
          Please bring <strong>${result.amount.toFixed(2).replace(/\.00$/, "")}</strong> to pay at the event.
        </p>
      )}
      {result.paymentMethod === "paypal" && (
        <p className="text-sm">
          Payment of <strong>${result.amount.toFixed(2).replace(/\.00$/, "")}</strong> received. Thank you!
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Check your email for a confirmation with a link to view or cancel your {event.event_type === "rsvp" ? "RSVP" : "registration"}.
      </p>
      <div className="flex justify-center">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
