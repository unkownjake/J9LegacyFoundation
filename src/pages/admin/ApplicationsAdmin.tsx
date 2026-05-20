import { useEffect, useMemo, useState } from "react";
import { Loader2, Download, Trash2, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/apiFetch";
import { getApplicationForm } from "@/lib/applicationForm";
import type { FormField, RegistrationForm } from "@/lib/types/registration";

interface Attachment {
  fieldId: string;
  path: string;
  name: string;
  size: number;
  mime: string;
}

interface ApplicationRow {
  id: string;
  status: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  answers: Record<string, unknown> | null;
  attachments: Attachment[] | null;
  notes: string | null;
  created_at: string;
}

const STATUSES = ["new", "reviewing", "accepted", "declined", "archived"];

const STATUS_BADGE: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-800",
  archived: "bg-muted text-muted-foreground",
};

function flattenFields(form: RegistrationForm | null): FormField[] {
  if (!form) return [];
  const out: FormField[] = [];
  form.sections.forEach((s) =>
    s.fields.forEach((f) => {
      if (f.kind !== "section_header") out.push(f);
    }),
  );
  return out;
}

function answerToString(field: FormField, value: unknown): string {
  if (value == null) return "";
  if (field.kind === "select" || field.kind === "multi_select") {
    const ids = Array.isArray(value) ? (value as string[]) : [String(value)];
    return ids.map((id) => field.options?.find((o) => o.id === id)?.label ?? id).join("; ");
  }
  if (field.kind === "checkbox" || field.kind === "waiver") return value ? "Yes" : "No";
  return String(value);
}

function csvEscape(v: string): string {
  if (v == null) return "";
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

async function signedUrl(path: string): Promise<string | null> {
  if (path.startsWith("http")) return path;
  return null;
}

export default function ApplicationsAdmin() {
  const [rows, setRows] = useState<ApplicationRow[] | null>(null);
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [selected, setSelected] = useState<ApplicationRow | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const res = await apiFetch("/api/applications");
    if (!res.ok) { toast.error("Failed to load applications"); return; }
    const data = await res.json();
    const normalized = (data as any[]).map((r) => ({
      ...r,
      applicant_name: r.applicantName ?? r.applicant_name,
      applicant_email: r.applicantEmail ?? r.applicant_email,
      applicant_phone: r.applicantPhone ?? r.applicant_phone,
      created_at: r.createdAt ?? r.created_at,
    }));
    setRows(normalized as ApplicationRow[]);
  }

  useEffect(() => {
    load();
    getApplicationForm().then(setForm);
  }, []);

  const fields = useMemo(() => flattenFields(form), [form]);

  async function handleStatusChange(row: ApplicationRow, status: string) {
    const res = await apiFetch(`/api/applications/${row.id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to update status");
      return;
    }
    setRows((prev) => (prev ?? []).map((r) => (r.id === row.id ? { ...r, status } : r)));
    if (selected?.id === row.id) setSelected((s) => s ? { ...s, status } : s);
  }

  async function handleDelete(row: ApplicationRow) {
    const res = await apiFetch(`/api/applications/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to delete");
      return;
    }
    setRows((prev) => (prev ?? []).filter((r) => r.id !== row.id));
    setSelected(null);
    toast.success("Application deleted");
  }

  async function handleExport() {
    if (!rows) return;
    const headers = ["Submitted", "Status", "Applicant name", "Email", "Phone", ...fields.map((f) => f.label || "(untitled)")];
    const lines = [headers.map(csvEscape).join(",")];
    const fileFieldIds = new Set(fields.filter((f) => f.kind === "file_upload").map((f) => f.id));
    const signed = new Map<string, string>();
    await Promise.all(
      rows.flatMap((r) =>
        (r.attachments ?? [])
          .filter((a) => fileFieldIds.has(a.fieldId))
          .map(async (a) => {
            const url = await signedUrl(a.path);
            if (url) signed.set(`${r.id}:${a.fieldId}`, url);
          }),
      ),
    );
    rows.forEach((r) => {
      const cells = [
        new Date(r.created_at).toISOString(),
        r.status,
        r.applicant_name,
        r.applicant_email,
        r.applicant_phone ?? "",
        ...fields.map((f) => {
          if (f.kind === "file_upload") {
            const att = (r.attachments ?? []).find((a) => a.fieldId === f.id);
            if (!att) return "";
            return `${att.name} ${signed.get(`${r.id}:${f.id}`) ?? ""}`.trim();
          }
          return answerToString(f, r.answers?.[f.id]);
        }),
      ];
      lines.push(cells.map((v) => csvEscape(String(v ?? ""))).join(","));
    });
    try {
      const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("CSV exported");
    } catch (e: unknown) {
      toast.error(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!rows) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary-darker">Sponsorship Applications</h1>
          <p className="text-sm text-muted-foreground">
            Sponsorship applications submitted from the public site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center text-sm text-muted-foreground">
          No applications yet.
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Submitted</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(r)}
                      className="font-semibold text-primary-darker hover:underline text-left"
                    >
                      {r.applicant_name}
                    </button>
                    {r.applicant_phone && (
                      <div className="text-xs text-muted-foreground">{r.applicant_phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">{r.applicant_email}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}{" "}
                    {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={r.status} onValueChange={(v) => handleStatusChange(r, v)}>
                      <SelectTrigger className="h-7 text-xs w-auto px-2 capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          className="p-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this application?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes the record and any uploaded files. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(r)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          {selected && (
            <ApplicationDetail
              row={selected}
              fields={fields}
              onStatusChange={(status) => handleStatusChange(selected, status)}
              onDelete={() => handleDelete(selected)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApplicationDetail({
  row,
  fields,
  onStatusChange,
  onDelete,
}: {
  row: ApplicationRow;
  fields: FormField[];
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}) {
  const [status, setStatus] = useState(row.status);
  const [objectUrls, setObjectUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fileFields = fields.filter((f) => f.kind === "file_upload");
  const nonFileFields = fields.filter((f) => f.kind !== "file_upload");

  // Auto-load all attachments on open
  useEffect(() => {
    const attachments = row.attachments ?? [];
    attachments.forEach((att) => {
      setLoading((d) => ({ ...d, [att.fieldId]: true }));
      apiFetch(`/api/applications/${row.id}/essay?fieldId=${encodeURIComponent(att.fieldId)}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setObjectUrls((u) => ({ ...u, [att.fieldId]: url }));
        })
        .catch(() => toast.error(`Failed to load ${att.name}`))
        .finally(() => setLoading((d) => ({ ...d, [att.fieldId]: false })));
    });
    return () => { Object.values(objectUrls).forEach((u) => URL.revokeObjectURL(u)); };
  }, [row.id]);

  return (
    <div className="flex h-[90vh] divide-x">
      {/* Left panel */}
      <div className="w-64 shrink-0 flex flex-col bg-muted/30 p-5 overflow-y-auto">
        <div className="space-y-3 mb-6">
          <h2 className="text-base font-bold text-primary-darker leading-tight">{row.applicant_name}</h2>
          <div className="space-y-2.5">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Email</p>
              <a href={`mailto:${row.applicant_email}`} className="text-sm text-primary hover:underline break-all">
                {row.applicant_email}
              </a>
            </div>
            {row.applicant_phone && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Phone</p>
                <p className="text-sm">{row.applicant_phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Submitted</p>
              <p className="text-sm">
                {new Date(row.created_at).toLocaleDateString(undefined, {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 mb-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Status</p>
          <Select
            value={status}
            onValueChange={(v) => { setStatus(v); onStatusChange(v); }}
          >
            <SelectTrigger className="h-8 text-sm capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {fileFields.length > 0 && (
          <div className="space-y-2 mb-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Files</p>
            {fileFields.map((f) => {
              const att = (row.attachments ?? []).find((a) => a.fieldId === f.id);
              if (!att) return null;
              const objectUrl = objectUrls[att.fieldId];
              const isBusy = loading[att.fieldId];
              return (
                <div key={f.id} className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-foreground truncate flex-1">{att.name}</span>
                  {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />}
                  {objectUrl && (
                    <Button asChild size="sm" variant="outline" className="h-6 text-xs px-2 shrink-0">
                      <a href={objectUrl} target="_blank" rel="noreferrer">
                        <Download className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-auto pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this application?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the record and any uploaded files. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* Form responses — exclude identity fields already shown in the summary card */}
        {nonFileFields.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Responses</h3>
            <dl className="space-y-4">
              {nonFileFields.map((f) => {
                const isIdentity =
                  f.kind === "email" ||
                  f.kind === "phone" ||
                  f.id === "applicant_name" ||
                  f.id === "applicant_email" ||
                  f.id === "applicant_phone" ||
                  /name/i.test(f.label ?? "");
                if (isIdentity) return null;
                const a = row.answers?.[f.id];
                if (a == null || a === "" || (Array.isArray(a) && a.length === 0)) return null;
                return (
                  <div key={f.id}>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">{f.label}</dt>
                    <dd className="text-sm whitespace-pre-wrap">{answerToString(f, a)}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}

        {/* File previews */}
        {fileFields.map((f) => {
          const att = (row.attachments ?? []).find((a) => a.fieldId === f.id);
          if (!att) return null;
          const objectUrl = objectUrls[att.fieldId];
          const isBusy = loading[att.fieldId];
          const isPdf = (att.mime || "").includes("pdf") || /\.pdf$/i.test(att.name);
          const isImage = (att.mime || "").startsWith("image/");
          return (
            <div key={f.id} className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{f.label}</h3>
              {isBusy && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center border rounded">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading preview…
                </div>
              )}
              {objectUrl && isPdf && (
                <iframe src={objectUrl} title={att.name} className="w-full h-[600px] border rounded" />
              )}
              {objectUrl && isImage && (
                <img src={objectUrl} alt={att.name} className="max-h-[600px] border rounded" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
