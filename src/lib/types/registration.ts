// Phase 2: pricing tiers + Google-Forms-style form builder.
// All shapes are persisted as JSONB on `events` (pricing_tiers, registration_form).

export type TierKind = "individual" | "team";

export interface PricingTier {
  id: string;
  kind: TierKind;
  name: string;
  /** Price in dollars (decimal). 0 = free. */
  price: number;
  description?: string;
  /** Team only — required minimum roster size (including captain). */
  rosterMin?: number;
  /** Team only — maximum roster size. */
  rosterMax?: number;
  /** Optional cap on number of registrations of this tier. */
  capacity?: number | null;
}

// ---------- Form builder ----------

export type FieldKind =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "select"
  | "multi_select"
  | "checkbox"
  | "section_header"
  | "waiver"
  | "file_upload";

export interface FieldOption {
  id: string;
  label: string;
}

/**
 * Show this field only if the referenced field's answer matches.
 * For select / multi_select: equals = option id; for checkbox: "true" / "false".
 */
export interface FieldShowIf {
  fieldId: string;
  equals: string;
}

export interface FormField {
  id: string;
  kind: FieldKind;
  label: string;
  helpText?: string;
  required?: boolean;
  placeholder?: string;
  /** select / multi_select options. */
  options?: FieldOption[];
  /** waiver: rich-text terms shown above the agreement checkbox. */
  waiverHtml?: string;
  /** waiver: label of the agreement checkbox. */
  waiverAgreeLabel?: string;
  /** file_upload: comma-separated MIME types or extensions accepted (e.g. ".pdf,.doc,.docx,image/*"). */
  acceptedTypes?: string;
  /** file_upload: maximum file size in MB. */
  maxSizeMb?: number;
  /** Per-field show/hide condition. */
  showIf?: FieldShowIf | null;
}

/**
 * Per-section "Go to" rule.
 * - kind=next: continue to the next section in order (default).
 * - kind=submit: end the form after this section.
 * - kind=goto: jump to a specific section id.
 * - kind=branch: branch on the value of a single-select field within this section.
 */
export type SectionGoToRule =
  | { kind: "next" }
  | { kind: "submit" }
  | { kind: "goto"; sectionId: string }
  | {
      kind: "branch";
      fieldId: string;
      // optionId -> destination section id (or "__submit__")
      branches: Record<string, string>;
      defaultSectionId?: string;
    };

export interface FormSection {
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
  goTo?: SectionGoToRule;
  /**
   * If true, the section's fields are collected once per teammate (Registration team flow).
   * Headcount drives how many copies are rendered.
   */
  repeatPerTeammate?: boolean;
}

export interface RegistrationForm {
  /** Title shown above the form (admin-facing helper). */
  title?: string;
  /** Optional intro shown above the first section. */
  intro?: string;
  sections: FormSection[];
}

export const emptyRegistrationForm: RegistrationForm = {
  title: "",
  intro: "",
  sections: [],
};

export function isTeamTier(t: PricingTier): boolean {
  return t.kind === "team";
}
