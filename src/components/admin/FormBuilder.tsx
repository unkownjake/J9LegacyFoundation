import { useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Eye,
  EyeOff,
  CornerDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import RichTextEditable from "@/components/admin/RichTextEditable";
import type {
  FieldKind,
  FieldOption,
  FormField,
  FormSection,
  RegistrationForm,
  SectionGoToRule,
} from "@/lib/types/registration";
import type { EventRecord } from "@/lib/types/events";
import { systemSectionsFor } from "@/lib/formSystemSections";
import { Lock, Users } from "lucide-react";

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

const FIELD_KIND_LABELS: Record<FieldKind, string> = {
  short_text: "Short text",
  long_text: "Long text",
  email: "Email",
  phone: "Phone",
  number: "Number",
  date: "Date",
  select: "Single choice",
  multi_select: "Multiple choice",
  checkbox: "Checkbox",
  section_header: "Section header",
  waiver: "Waiver / agreement",
  file_upload: "File upload",
};

const SUBMIT_TOKEN = "__submit__";

interface Props {
  form: RegistrationForm;
  editing: boolean;
  onChange: (next: RegistrationForm) => void;
  /** Optional context to render locked built-in sections + repeating-section toggle. */
  event?: EventRecord;
}

function newField(kind: FieldKind): FormField {
  const base: FormField = {
    id: uid("f"),
    kind,
    label:
      kind === "section_header"
        ? "Section header"
        : kind === "waiver"
        ? "Liability waiver"
        : "Untitled question",
  };
  if (kind === "select" || kind === "multi_select") {
    base.options = [
      { id: uid("o"), label: "Option 1" },
      { id: uid("o"), label: "Option 2" },
    ];
  }
  if (kind === "waiver") {
    base.waiverHtml = "<p>Replace with your waiver text…</p>";
    base.waiverAgreeLabel = "I have read and agree to the terms above.";
  }
  if (kind === "file_upload") {
    base.acceptedTypes = ".pdf,.doc,.docx";
    base.maxSizeMb = 10;
  }
  return base;
}

function newSection(isLast = true): FormSection {
  return {
    id: uid("s"),
    title: "",
    description: "",
    fields: [],
    goTo: isLast ? { kind: "submit" } : { kind: "next" },
  };
}

export default function FormBuilder({ form, editing, onChange, event }: Props) {
  const sections = form.sections ?? [];
  const systemSections = event ? systemSectionsFor(event) : [];
  const teamSupported =
    event?.event_type === "registration" &&
    (event.pricing_tiers ?? []).some((p) => p.kind === "team");

  function setSections(next: FormSection[]) {
    onChange({ ...form, sections: next });
  }
  function updateSection(id: string, patch: Partial<FormSection>) {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function moveSection(idx: number, dir: -1 | 1) {
    const next = sections.slice();
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSections(next);
  }
  function removeSection(id: string) {
    setSections(sections.filter((s) => s.id !== id));
  }
  function addSection() {
    const next = sections.map((s, i) =>
      i === sections.length - 1 && s.goTo?.kind === "submit"
        ? { ...s, goTo: { kind: "next" as const } }
        : s,
    );
    setSections([...next, newSection(true)]);
  }

  // Flatten earlier fields once for the show-if picker.
  const allFieldsInOrder = useMemo(() => {
    const list: { sectionId: string; sectionIdx: number; field: FormField }[] = [];
    sections.forEach((s, sectionIdx) => {
      s.fields.forEach((f) => list.push({ sectionId: s.id, sectionIdx, field: f }));
    });
    return list;
  }, [sections]);

  const formLabel =
    event?.event_type === "rsvp"
      ? "RSVP form"
      : event?.event_type === "registration"
      ? "Registration form"
      : "Form";

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-primary-darker">{formLabel}</h2>
          <p className="text-xs text-muted-foreground">
            {event?.event_type === "rsvp"
              ? "The locked sections below are always collected. Add additional sections if you need more info."
              : "Build the multi-section form registrants will fill out. Sections can branch and individual fields can show conditionally."}
          </p>
        </div>
        {editing && (
          <Button type="button" size="sm" variant="outline" onClick={addSection}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add section
          </Button>
        )}
      </div>

      {(editing || form.intro) && (
        <div className="space-y-1">
          <Label className="text-xs">Form intro (optional)</Label>
          <Textarea
            rows={2}
            value={form.intro ?? ""}
            onChange={(e) => onChange({ ...form, intro: e.target.value })}
            disabled={!editing}
            placeholder="Shown above the first section on the public form."
          />
        </div>
      )}

      {systemSections.length > 0 && (
        <div className="space-y-3">
          {systemSections.map((s, i) => (
            <LockedSectionPreview key={s.id} section={s} index={i} />
          ))}
        </div>
      )}

      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground italic border border-dashed rounded-md p-6 text-center">
          {systemSections.length > 0
            ? "No additional sections. " + (editing ? "Click Add section to ask custom questions." : "")
            : "No sections yet. " + (editing ? "Click Add section to get started." : "")}
        </p>
      ) : (
        <div className="space-y-4">
          {sections.map((section, idx) => (
            <SectionEditor
              key={section.id}
              section={section}
              sectionIdx={idx}
              totalSections={sections.length}
              allSections={sections}
              allFieldsInOrder={allFieldsInOrder}
              editing={editing}
              teamSupported={teamSupported}
              onUpdate={(patch) => updateSection(section.id, patch)}
              onMove={(dir) => moveSection(idx, dir)}
              onRemove={() => removeSection(section.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LockedSectionPreview({ section, index }: { section: FormSection; index: number }) {
  return (
    <div className="border-2 border-dashed border-muted-foreground/30 rounded-md bg-muted/20">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-muted-foreground/20 bg-muted/40 rounded-t-[4px]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Built-in · {section.title || `Section ${index + 1}`}
        </div>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Always collected
        </span>
      </div>
      <div className="p-3 space-y-2">
        {section.description && (
          <p className="text-xs text-muted-foreground">{section.description}</p>
        )}
        <div className="space-y-1.5">
          {section.fields.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-2 text-xs bg-white border rounded px-2 py-1.5"
            >
              <span className="font-medium text-foreground/80">
                {f.label}
                {f.required && <span className="text-primary ml-1">*</span>}
              </span>
              <span className="text-muted-foreground">{FIELD_KIND_LABELS[f.kind]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Section ----------

interface SectionEditorProps {
  section: FormSection;
  sectionIdx: number;
  totalSections: number;
  allSections: FormSection[];
  allFieldsInOrder: { sectionId: string; sectionIdx: number; field: FormField }[];
  editing: boolean;
  teamSupported?: boolean;
  onUpdate: (patch: Partial<FormSection>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

function SectionEditor({
  section,
  sectionIdx,
  totalSections,
  allSections,
  allFieldsInOrder,
  editing,
  teamSupported,
  onUpdate,
  onMove,
  onRemove,
}: SectionEditorProps) {
  function updateField(fieldId: string, patch: Partial<FormField>) {
    onUpdate({
      fields: section.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
    });
  }
  function removeField(fieldId: string) {
    onUpdate({ fields: section.fields.filter((f) => f.id !== fieldId) });
  }
  function addField(kind: FieldKind) {
    onUpdate({ fields: [...section.fields, newField(kind)] });
  }
  function moveField(idx: number, dir: -1 | 1) {
    const next = section.fields.slice();
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onUpdate({ fields: next });
  }

  // Fields in earlier sections (or earlier in this section) are eligible as show-if sources.
  const eligibleShowIfFields = allFieldsInOrder.filter(
    (entry) => entry.sectionIdx < sectionIdx || entry.sectionId === section.id,
  );

  // Single-choice fields *in this section* are eligible to drive a branch goto.
  const branchableFields = section.fields.filter((f) => f.kind === "select");

  return (
    <div className="border-2 border-primary/20 rounded-md bg-peach/30 shadow-sm">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-primary/20 bg-gradient-to-r from-peach to-peach/50 rounded-t-[4px]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-darker">
          <GripVertical className="h-3.5 w-3.5" />
          Section {sectionIdx + 1}
          {section.repeatPerTeammate && (
            <span className="inline-flex items-center gap-1 normal-case tracking-normal bg-primary/15 text-primary-darker px-1.5 py-0.5 rounded">
              <Users className="h-3 w-3" /> Repeats per teammate
            </span>
          )}
        </div>
        {editing && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={sectionIdx === 0}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded disabled:opacity-30"
              title="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={sectionIdx === totalSections - 1}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded disabled:opacity-30"
              title="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 text-muted-foreground hover:text-destructive rounded"
              title="Remove section"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1 md:col-span-1">
            <Label className="text-xs">Title (optional)</Label>
            <Input
              value={section.title ?? ""}
              onChange={(e) => onUpdate({ title: e.target.value })}
              disabled={!editing}
              placeholder="Untitled section"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Description (optional)</Label>
            <Input
              value={section.description ?? ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              disabled={!editing}
            />
          </div>
        </div>

        {teamSupported && (
          <div className="flex items-center justify-between gap-3 border rounded-md bg-white px-3 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-darker">
                <Users className="h-3.5 w-3.5" /> Repeat per teammate
              </div>
              <p className="text-[11px] text-muted-foreground">
                Collect this section's fields once for each teammate (team registrations only). Hidden for individual registrations.
              </p>
            </div>
            <Switch
              checked={!!section.repeatPerTeammate}
              onCheckedChange={(v) => onUpdate({ repeatPerTeammate: v })}
              disabled={!editing}
            />
          </div>
        )}

        {/* Fields */}
        <div className="space-y-2">
          {section.fields.length === 0 ? (
            <p className="text-xs text-muted-foreground italic border border-dashed rounded p-4 text-center">
              No fields yet.
            </p>
          ) : (
            section.fields.map((field, fIdx) => (
              <FieldEditor
                key={field.id}
                field={field}
                idx={fIdx}
                total={section.fields.length}
                eligibleShowIfFields={eligibleShowIfFields.filter((e) => e.field.id !== field.id)}
                editing={editing}
                onUpdate={(patch) => updateField(field.id, patch)}
                onMove={(dir) => moveField(fIdx, dir)}
                onRemove={() => removeField(field.id)}
              />
            ))
          )}

          {editing && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground">Add:</span>
              {(Object.keys(FIELD_KIND_LABELS) as FieldKind[]).map((k) => (
                <Button
                  key={k}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addField(k)}
                  className="h-7 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {FIELD_KIND_LABELS[k]}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Section Go-to */}
        <SectionGoToEditor
          section={section}
          sectionIdx={sectionIdx}
          isLast={sectionIdx === totalSections - 1}
          allSections={allSections}
          branchableFields={branchableFields}
          editing={editing}
          onUpdate={(goTo) => onUpdate({ goTo })}
        />
      </div>
    </div>
  );
}

// ---------- Field ----------

interface FieldEditorProps {
  field: FormField;
  idx: number;
  total: number;
  eligibleShowIfFields: { sectionId: string; sectionIdx: number; field: FormField }[];
  editing: boolean;
  onUpdate: (patch: Partial<FormField>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

function FieldEditor({
  field,
  idx,
  total,
  eligibleShowIfFields,
  editing,
  onUpdate,
  onMove,
  onRemove,
}: FieldEditorProps) {
  const hasOptions = field.kind === "select" || field.kind === "multi_select";

  function updateOptions(next: FieldOption[]) {
    onUpdate({ options: next });
  }
  function addOption() {
    updateOptions([...(field.options ?? []), { id: uid("o"), label: "Option" }]);
  }
  function removeOption(id: string) {
    updateOptions((field.options ?? []).filter((o) => o.id !== id));
    // If something was branched on this option elsewhere, that's handled at branch-render time.
  }

  return (
    <div className="border border-border rounded bg-white p-3 space-y-2 shadow-sm hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
            {FIELD_KIND_LABELS[field.kind]}
          </span>
          {field.required && <span className="text-primary font-semibold">*required</span>}
          {field.showIf && (
            <span className="inline-flex items-center gap-1 text-primary-darker bg-primary/10 px-1.5 py-0.5 rounded">
              <EyeOff className="h-3 w-3" /> conditional
            </span>
          )}
        </div>
        {editing && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={idx === 0}
              className="p-1 text-muted-foreground hover:text-foreground rounded disabled:opacity-30"
              title="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={idx === total - 1}
              className="p-1 text-muted-foreground hover:text-foreground rounded disabled:opacity-30"
              title="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-muted-foreground hover:text-destructive rounded"
              title="Remove field"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">
            {field.kind === "section_header" ? "Heading" : "Question / label"}
          </Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            disabled={!editing}
          />
        </div>
        {field.kind !== "section_header" && field.kind !== "waiver" && (
          <div className="space-y-1">
            <Label className="text-xs">Help text (optional)</Label>
            <Input
              value={field.helpText ?? ""}
              onChange={(e) => onUpdate({ helpText: e.target.value })}
              disabled={!editing}
            />
          </div>
        )}
      </div>

      {hasOptions && (
        <div className="space-y-1">
          <Label className="text-xs">Options</Label>
          <div className="space-y-1">
            {(field.options ?? []).map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <Input
                  value={opt.label}
                  onChange={(e) =>
                    updateOptions(
                      (field.options ?? []).map((o) =>
                        o.id === opt.id ? { ...o, label: e.target.value } : o,
                      ),
                    )
                  }
                  disabled={!editing}
                  className="h-8"
                />
                {editing && (
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {editing && (
              <Button type="button" size="sm" variant="outline" onClick={addOption} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add option
              </Button>
            )}
          </div>
        </div>
      )}

      {field.kind === "waiver" && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Waiver terms</Label>
            <RichTextEditable
              value={field.waiverHtml ?? ""}
              editable={editing}
              onChange={(html) => onUpdate({ waiverHtml: html })}
              className="min-h-[120px] border rounded p-2 bg-white text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Agreement checkbox label</Label>
            <Input
              value={field.waiverAgreeLabel ?? ""}
              onChange={(e) => onUpdate({ waiverAgreeLabel: e.target.value })}
              disabled={!editing}
            />
          </div>
        </div>
      )}

      {field.kind === "file_upload" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Accepted file types</Label>
            <Input
              value={field.acceptedTypes ?? ""}
              onChange={(e) => onUpdate({ acceptedTypes: e.target.value })}
              disabled={!editing}
              placeholder=".pdf,.doc,.docx,image/*"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max size (MB)</Label>
            <Input
              type="number"
              value={field.maxSizeMb ?? 10}
              onChange={(e) => onUpdate({ maxSizeMb: Number(e.target.value) || 10 })}
              disabled={!editing}
            />
          </div>
        </div>
      )}

      {field.kind !== "section_header" && (
        <div className="flex items-center justify-between gap-3 pt-1 border-t mt-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Required</Label>
            <Switch
              checked={!!field.required}
              onCheckedChange={(v) => onUpdate({ required: v })}
              disabled={!editing}
            />
          </div>

          <ShowIfPopover
            field={field}
            eligibleShowIfFields={eligibleShowIfFields}
            editing={editing}
            onChange={(showIf) => onUpdate({ showIf })}
          />
        </div>
      )}
    </div>
  );
}

// ---------- Show-if popover ----------

function ShowIfPopover({
  field,
  eligibleShowIfFields,
  editing,
  onChange,
}: {
  field: FormField;
  eligibleShowIfFields: { sectionId: string; sectionIdx: number; field: FormField }[];
  editing: boolean;
  onChange: (showIf: FormField["showIf"]) => void;
}) {
  // Only fields with discrete answers are useful as conditions.
  const discreteSources = eligibleShowIfFields.filter(
    (e) => e.field.kind === "select" || e.field.kind === "checkbox",
  );

  const sourceField = field.showIf
    ? discreteSources.find((e) => e.field.id === field.showIf!.fieldId)?.field
    : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={field.showIf ? "default" : "outline"}
          className="h-7 text-xs"
          disabled={!editing && !field.showIf}
        >
          {field.showIf ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
          {field.showIf ? "Conditional" : "Show always"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2" align="end">
        <p className="text-xs text-muted-foreground">
          Only show this field when an earlier single-choice or checkbox question has a specific answer.
        </p>
        {discreteSources.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">
            No earlier single-choice or checkbox fields available.
          </p>
        ) : (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Depends on</Label>
              <Select
                value={field.showIf?.fieldId ?? ""}
                onValueChange={(v) =>
                  onChange({ fieldId: v, equals: "" })
                }
                disabled={!editing}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Pick a field…" />
                </SelectTrigger>
                <SelectContent>
                  {discreteSources.map((e) => (
                    <SelectItem key={e.field.id} value={e.field.id}>
                      §{e.sectionIdx + 1} · {e.field.label || "(untitled)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sourceField && (
              <div className="space-y-1">
                <Label className="text-xs">Equals</Label>
                <Select
                  value={field.showIf?.equals ?? ""}
                  onValueChange={(v) =>
                    onChange({ fieldId: field.showIf!.fieldId, equals: v })
                  }
                  disabled={!editing}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Pick a value…" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceField.kind === "checkbox" ? (
                      <>
                        <SelectItem value="true">Checked</SelectItem>
                        <SelectItem value="false">Unchecked</SelectItem>
                      </>
                    ) : (
                      (sourceField.options ?? []).map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            {field.showIf && editing && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onChange(null)}
                className="h-7 text-xs w-full"
              >
                Clear condition
              </Button>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ---------- Section Go-to ----------

function SectionGoToEditor({
  section,
  sectionIdx,
  isLast,
  allSections,
  branchableFields,
  editing,
  onUpdate,
}: {
  section: FormSection;
  sectionIdx: number;
  isLast: boolean;
  allSections: FormSection[];
  branchableFields: FormField[];
  editing: boolean;
  onUpdate: (goTo: SectionGoToRule) => void;
}) {
  const goTo: SectionGoToRule = section.goTo ?? (isLast ? { kind: "submit" } : { kind: "next" });
  const otherSections = allSections.filter((s) => s.id !== section.id);

  // The last section can never "continue to next" — there is no next.
  // If somehow set that way (e.g. a section was deleted after it), auto-correct on render.
  useEffect(() => {
    if (isLast && goTo.kind === "next") onUpdate({ kind: "submit" });
  }, [isLast, goTo.kind]);

  function setKind(kind: SectionGoToRule["kind"]) {
    if (kind === "next") onUpdate({ kind: "next" });
    else if (kind === "submit") onUpdate({ kind: "submit" });
    else if (kind === "goto")
      onUpdate({ kind: "goto", sectionId: otherSections[0]?.id ?? "" });
    else
      onUpdate({
        kind: "branch",
        fieldId: branchableFields[0]?.id ?? "",
        branches: {},
      });
  }

  return (
    <div className="border-t border-primary/20 pt-3 mt-2 space-y-2 bg-white/60 -mx-3 -mb-3 px-3 pb-3 rounded-b-md">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-darker">
        <CornerDownRight className="h-3.5 w-3.5" />
        After this section
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={goTo.kind} onValueChange={(v) => setKind(v as SectionGoToRule["kind"])} disabled={!editing}>
          <SelectTrigger className="h-8 text-sm w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="next" disabled={isLast}>
              Continue to next section
            </SelectItem>
            <SelectItem value="goto" disabled={otherSections.length === 0}>
              Go to a specific section
            </SelectItem>
            <SelectItem value="branch" disabled={branchableFields.length === 0}>
              Branch on an answer
            </SelectItem>
            <SelectItem value="submit">Submit form</SelectItem>
          </SelectContent>
        </Select>
        {isLast && (
          <p className="text-xs text-muted-foreground italic">Last section — must submit.</p>
        )}

        {goTo.kind === "goto" && (
          <Select
            value={goTo.sectionId}
            onValueChange={(v) => onUpdate({ kind: "goto", sectionId: v })}
            disabled={!editing}
          >
            <SelectTrigger className="h-8 text-sm w-[260px]">
              <SelectValue placeholder="Pick a section…" />
            </SelectTrigger>
            <SelectContent>
              {otherSections.map((s, i) => (
                <SelectItem key={s.id} value={s.id}>
                  §{allSections.findIndex((x) => x.id === s.id) + 1} · {s.title || "(untitled)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {goTo.kind === "branch" && (
        <BranchEditor
          goTo={goTo}
          section={section}
          sectionIdx={sectionIdx}
          allSections={allSections}
          branchableFields={branchableFields}
          editing={editing}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

function BranchEditor({
  goTo,
  section,
  sectionIdx,
  allSections,
  branchableFields,
  editing,
  onUpdate,
}: {
  goTo: Extract<SectionGoToRule, { kind: "branch" }>;
  section: FormSection;
  sectionIdx: number;
  allSections: FormSection[];
  branchableFields: FormField[];
  editing: boolean;
  onUpdate: (goTo: SectionGoToRule) => void;
}) {
  const driver =
    branchableFields.find((f) => f.id === goTo.fieldId) ?? branchableFields[0];
  const otherSections = allSections.filter((s) => s.id !== section.id);

  function setBranch(optionId: string, dest: string) {
    onUpdate({
      ...goTo,
      branches: { ...goTo.branches, [optionId]: dest },
    });
  }

  return (
    <div className="space-y-2 pl-2 border-l-2 border-muted ml-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Label className="text-xs">Branch on</Label>
        <Select
          value={goTo.fieldId}
          onValueChange={(v) => onUpdate({ ...goTo, fieldId: v, branches: {} })}
          disabled={!editing}
        >
          <SelectTrigger className="h-8 text-sm w-[260px]">
            <SelectValue placeholder="Pick a single-choice field…" />
          </SelectTrigger>
          <SelectContent>
            {branchableFields.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.label || "(untitled)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {driver?.options?.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground min-w-[100px]">
            If "{opt.label}":
          </span>
          <Select
            value={goTo.branches[opt.id] ?? ""}
            onValueChange={(v) => setBranch(opt.id, v)}
            disabled={!editing}
          >
            <SelectTrigger className="h-8 text-sm w-[260px]">
              <SelectValue placeholder="Pick destination…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SUBMIT_TOKEN}>Submit form</SelectItem>
              {otherSections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  §{allSections.findIndex((x) => x.id === s.id) + 1} · {s.title || "(untitled)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground min-w-[100px]">Default:</span>
        <Select
          value={goTo.defaultSectionId ?? ""}
          onValueChange={(v) => onUpdate({ ...goTo, defaultSectionId: v })}
          disabled={!editing}
        >
          <SelectTrigger className="h-8 text-sm w-[260px]">
            <SelectValue placeholder="Continue to next section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SUBMIT_TOKEN}>Submit form</SelectItem>
            {otherSections.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                §{allSections.findIndex((x) => x.id === s.id) + 1} · {s.title || "(untitled)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
