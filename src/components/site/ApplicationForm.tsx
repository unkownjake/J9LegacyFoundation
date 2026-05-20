import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload, FileText, X } from "lucide-react";
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
import type {
  FormField,
  FormSection,
  RegistrationForm,
} from "@/lib/types/registration";
import { pickApplicantIdentity } from "@/lib/applicationForm";

type Answers = Record<string, unknown>;

interface UploadedFile {
  fieldId: string;
  path: string;
  name: string;
  size: number;
  mime: string;
}

interface Props {
  form: RegistrationForm;
  onClose?: () => void;
  onSuccess?: () => void;
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
  if (field.kind === "file_upload") return value != null && String(value).length > 0;
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
  return null;
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}

export default function ApplicationForm({ form, onClose, onSuccess }: Props) {
  const [answers, setAnswers] = useState<Answers>({});
  const [uploads, setUploads] = useState<Record<string, UploadedFile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [sectionStack, setSectionStack] = useState<string[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(
    form.sections[0]?.id ?? null,
  );

  useEffect(() => {
    setCurrentSectionId(form.sections[0]?.id ?? null);
    setSectionStack([]);
  }, [form]);

  const currentSection = form.sections.find((s) => s.id === currentSectionId) ?? null;
  const isFirstSection = currentSection?.id === form.sections[0]?.id;

  function setAnswer(fieldId: string, value: unknown) {
    setAnswers((a) => ({ ...a, [fieldId]: value }));
    setErrors((e) => {
      const { [fieldId]: _drop, ...rest } = e;
      return rest;
    });
  }

  function validateSection(section: FormSection): boolean {
    const e: Record<string, string> = {};
    section.fields.forEach((f) => {
      if (!fieldVisible(f, answers)) return;
      const err = validateField(f, answers[f.id]);
      if (err) e[f.id] = err;
    });
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
    const idx = form.sections.findIndex((s) => s.id === section.id);
    const next = form.sections[idx + 1];
    return next ? next.id : "__submit__";
  }

  function advance() {
    if (!currentSection) return;
    if (!validateSection(currentSection)) return;
    const dest = nextSectionIdFor(currentSection);
    if (dest === "__submit__") {
      submit();
      return;
    }
    setSectionStack((s) => [...s, currentSection.id]);
    setCurrentSectionId(dest);
  }

  function goBack() {
    if (sectionStack.length === 0) {
      onClose?.();
      return;
    }
    const prev = sectionStack[sectionStack.length - 1];
    setSectionStack((s) => s.slice(0, -1));
    setCurrentSectionId(prev);
  }

  async function uploadFile(field: FormField, file: File) {
    const maxMb = Number(field.maxSizeMb) || 10;
    if (file.size > maxMb * 1024 * 1024) {
      setErrors((e) => ({ ...e, [field.id]: `File must be under ${maxMb}MB` }));
      return;
    }
    const safeFilename2 = `${crypto.randomUUID()}-${safeFilename(file.name)}`;
    const res = await fetch(`/api/upload/essay?filename=${encodeURIComponent(safeFilename2)}`, {
      method: "POST",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(`Upload failed: ${err.error ?? "Unknown error"}`);
      return;
    }
    const { url } = await res.json();
    const meta: UploadedFile = {
      fieldId: field.id,
      path: url,
      name: file.name,
      size: file.size,
      mime: file.type,
    };
    setUploads((u) => ({ ...u, [field.id]: meta }));
    setAnswer(field.id, url);
  }

  async function submit() {
    setSubmitting(true);
    try {
      const ident = pickApplicantIdentity(form, answers);
      if (!ident.name || !ident.email || !isEmail(ident.email)) {
        toast.error("A valid name and email are required to submit.");
        setSubmitting(false);
        return;
      }
      const attachments = Object.values(uploads).map((u) => ({
        fieldId: u.fieldId,
        path: u.path,
        url: u.path,
        name: u.name,
        size: u.size,
        mime: u.mime,
      }));
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_name: ident.name,
          applicant_email: ident.email,
          applicant_phone: ident.phone,
          status: "new",
          answers,
          attachments,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Submission failed");
        return;
      }
      // Fire-and-forget confirmation email
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: "application_received",
          to: ident.email,
          data: { applicantName: ident.name },
          notifyType: "applications",
        }),
      }).catch((err) => console.warn("application email failed", err));
      setDone(true);
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center py-4">
        <h3 className="text-xl font-bold text-primary-darker">Application received! 🎉</h3>
        <p className="text-sm text-muted-foreground">
          Thanks for applying. We'll review your application and reach out by email.
        </p>
        <div className="flex justify-center">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  if (!currentSection) {
    return <p className="text-sm text-muted-foreground">No application form configured yet.</p>;
  }

  return (
    <div className="space-y-4">
      {isFirstSection && form.intro && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap border-l-4 border-primary/30 pl-3">
          {form.intro}
        </p>
      )}
      {currentSection.title && (
        <h3 className="text-lg font-semibold text-primary-darker">{currentSection.title}</h3>
      )}
      {currentSection.description && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {currentSection.description}
        </p>
      )}
      <div className="space-y-4">
        {currentSection.fields
          .filter((f) => fieldVisible(f, answers))
          .map((f) => (
            <FieldRenderer
              key={f.id}
              field={f}
              value={answers[f.id]}
              upload={uploads[f.id]}
              onChange={(v) => setAnswer(f.id, v)}
              onUpload={(file) => uploadFile(f, file)}
              onClearUpload={() => {
                setUploads((u) => {
                  const { [f.id]: _drop, ...rest } = u;
                  return rest;
                });
                setAnswer(f.id, "");
              }}
              error={errors[f.id]}
            />
          ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t mt-2">
        <Button type="button" variant="ghost" onClick={goBack} disabled={submitting}>
          {sectionStack.length === 0 ? "Cancel" : "Back"}
        </Button>
        <Button type="button" onClick={advance} disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : nextSectionIdFor(currentSection) === "__submit__" ? (
            "Submit application"
          ) : (
            "Next"
          )}
        </Button>
      </div>
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
  upload,
  onChange,
  onUpload,
  onClearUpload,
  error,
}: {
  field: FormField;
  value: unknown;
  upload?: UploadedFile;
  onChange: (v: unknown) => void;
  onUpload: (file: File) => void;
  onClearUpload: () => void;
  error?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <Checkbox checked={value === true} onCheckedChange={(v) => onChange(v === true)} />
          <span>{field.waiverAgreeLabel ?? "I agree"}</span>
        </label>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
  if (field.kind === "file_upload") {
    return (
      <Field label={field.label} error={error} required={field.required} helpText={field.helpText}>
        {upload ? (
          <div className="flex items-center justify-between gap-2 border rounded-md p-2 bg-muted/30">
            <div className="flex items-center gap-2 text-sm min-w-0">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{upload.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                ({(upload.size / 1024).toFixed(0)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={onClearUpload}
              className="text-muted-foreground hover:text-destructive p-1"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={field.acceptedTypes ?? undefined}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose file
            </Button>
            {field.acceptedTypes && (
              <span className="ml-2 text-xs text-muted-foreground">
                Accepted: {field.acceptedTypes}
              </span>
            )}
          </div>
        )}
      </Field>
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
