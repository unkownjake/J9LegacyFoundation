import { getPageContent, savePageContent } from "@/lib/cms";
import type { RegistrationForm } from "@/lib/types/registration";

export const APPLICATION_FORM_SLUG = "sponsorship-application-form";

export const defaultApplicationForm: RegistrationForm = {
  title: "Sponsorship Application",
  intro:
    "Tell us about yourself and the camp or program you'd like sponsored. Required fields are marked with *.",
  sections: [
    {
      id: "s-applicant",
      title: "Applicant",
      fields: [
        { id: "applicant_name", kind: "short_text", label: "Full name", required: true },
        { id: "applicant_email", kind: "email", label: "Email", required: true },
        { id: "applicant_phone", kind: "phone", label: "Phone (optional)" },
        { id: "applicant_age", kind: "number", label: "Age" },
        { id: "school", kind: "short_text", label: "School" },
        { id: "grade", kind: "short_text", label: "Grade" },
      ],
      goTo: { kind: "next" },
    },
    {
      id: "s-parent",
      title: "Parent / Guardian",
      fields: [
        { id: "parent_name", kind: "short_text", label: "Parent name" },
        { id: "parent_email", kind: "email", label: "Parent email" },
        { id: "parent_phone", kind: "phone", label: "Parent phone" },
      ],
      goTo: { kind: "next" },
    },
    {
      id: "s-camp",
      title: "Camp / Program",
      fields: [
        { id: "camp_name", kind: "short_text", label: "Camp or program name", required: true },
        { id: "camp_url", kind: "short_text", label: "Camp website (URL)" },
        { id: "camp_cost", kind: "number", label: "Estimated cost ($)" },
        { id: "why", kind: "long_text", label: "Why this camp matters to you", required: true },
        {
          id: "essay",
          kind: "file_upload",
          label: "Application essay (upload)",
          helpText: "PDF or Word document, up to 10MB.",
          acceptedTypes: ".pdf,.doc,.docx",
          maxSizeMb: 10,
        },
      ],
      goTo: { kind: "submit" },
    },
  ],
};

export async function getApplicationForm(): Promise<RegistrationForm> {
  const data = await getPageContent<RegistrationForm>(APPLICATION_FORM_SLUG);
  return data ?? defaultApplicationForm;
}

export async function saveApplicationForm(form: RegistrationForm) {
  await savePageContent(APPLICATION_FORM_SLUG, form);
}

/** Heuristic: pick which fields map to the canonical applicant_name / applicant_email columns. */
export function pickApplicantIdentity(
  form: RegistrationForm,
  answers: Record<string, unknown>,
): { name: string; email: string; phone: string | null } {
  let name = "";
  let email = "";
  let phone = "";
  for (const s of form.sections) {
    for (const f of s.fields) {
      const v = answers[f.id];
      if (v == null || v === "") continue;
      const lbl = (f.label || "").toLowerCase();
      if (!name && (f.id === "applicant_name" || /name/.test(lbl)) && f.kind !== "file_upload") {
        name = String(v);
      }
      if (!email && (f.kind === "email" || f.id === "applicant_email")) {
        email = String(v);
      }
      if (!phone && (f.kind === "phone" || /phone/.test(lbl))) {
        phone = String(v);
      }
    }
  }
  return { name, email, phone: phone || null };
}
