import type { EventRecord } from "@/lib/types/events";
import type { FormSection, FormField } from "@/lib/types/registration";

// Stable IDs for system fields so answers map consistently and we can find them in renderers.
export const SYS_FIELD_IDS = {
  fullName: "__sys_full_name",
  email: "__sys_email",
  phone: "__sys_phone",
  headcount: "__sys_headcount",
  regKind: "__sys_reg_kind", // (placeholder if ever needed)
} as const;

export const SYS_SECTION_IDS = {
  contact: "__sys_contact",
  rsvpHeadcount: "__sys_rsvp_headcount",
  teamHeadcount: "__sys_team_headcount",
  teammates: "__sys_teammates",
} as const;

function f(
  id: string,
  kind: FormField["kind"],
  label: string,
  extra: Partial<FormField> = {},
): FormField {
  return { id, kind, label, required: true, ...extra };
}

/**
 * The locked, built-in sections shown above admin-defined sections in the builder
 * AND rendered on the public form. They are NEVER persisted into registration_form.
 */
export function systemSectionsFor(event: EventRecord): FormSection[] {
  const t = event.event_type;

  if (t === "rsvp") {
    return [
      {
        id: SYS_SECTION_IDS.contact,
        title: "Your details",
        description: "Always collected for every RSVP.",
        fields: [
          f(SYS_FIELD_IDS.fullName, "short_text", "Full name"),
          f(SYS_FIELD_IDS.email, "email", "Email"),
          f(SYS_FIELD_IDS.phone, "phone", "Phone", { required: false }),
        ],
      },
      {
        id: SYS_SECTION_IDS.rsvpHeadcount,
        title: "Headcount",
        description: "How many people in your party (including you).",
        fields: [
          f(SYS_FIELD_IDS.headcount, "number", "Number of people", {
            placeholder: "1",
          }),
        ],
      },
    ];
  }

  if (t === "registration") {
    const tiers = event.pricing_tiers ?? [];
    const hasTeam = tiers.some((p) => p.kind === "team");
    const hasIndiv = tiers.some((p) => p.kind === "individual");
    // If tiers aren't set, fallback to "individual" assumption.
    const treatAsTeam = hasTeam;

    const sections: FormSection[] = [
      {
        id: SYS_SECTION_IDS.contact,
        title: hasTeam && !hasIndiv ? "Captain details" : "Your details",
        description:
          hasTeam && hasIndiv
            ? "If registering as a team, this is the captain's info."
            : "Always collected for every registration.",
        fields: [
          f(SYS_FIELD_IDS.fullName, "short_text", "Full name"),
          f(SYS_FIELD_IDS.email, "email", "Email"),
          f(SYS_FIELD_IDS.phone, "phone", "Phone", { required: false }),
        ],
      },
    ];
    if (treatAsTeam) {
      sections.push({
        id: SYS_SECTION_IDS.teamHeadcount,
        title: "Team headcount",
        description:
          "Only collected for team registrations. Determines how many teammate forms appear.",
        fields: [
          f(SYS_FIELD_IDS.headcount, "number", "Number of teammates", {
            placeholder: "e.g. 4",
          }),
        ],
      });
    }
    return sections;
  }

  // dropin: no built-in sections
  return [];
}

export function isSystemSectionId(id: string): boolean {
  return id.startsWith("__sys_");
}
