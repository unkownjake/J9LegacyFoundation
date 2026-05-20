import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/apiFetch";
import type { EventRecord } from "@/lib/types/events";
import type { FormField } from "@/lib/types/registration";

interface SubmissionRow {
  id: string;
  status: string;
  pricing_tier_name: string | null;
  pricing_tier_kind: string | null;
  amount: number;
  payment_method: string;
  payment_status: string;
  submitter_name: string;
  submitter_email: string;
  submitter_phone: string | null;
  team_name: string | null;
  roster: Array<{ name?: string; email?: string; phone?: string; notes?: string }>;
  headcount: number;
  answers: Record<string, unknown>;
  created_at: string;
  cancelled_at: string | null;
}

function flattenFields(event: EventRecord): FormField[] {
  const out: FormField[] = [];
  (event.registration_form?.sections ?? []).forEach((s) => {
    s.fields.forEach((f) => {
      if (f.kind !== "section_header") out.push(f);
    });
  });
  return out;
}

function answerToString(field: FormField, value: unknown): string {
  if (value == null) return "";
  if (field.kind === "select" || field.kind === "multi_select") {
    const ids = Array.isArray(value) ? (value as string[]) : [String(value)];
    return ids
      .map((id) => field.options?.find((o) => o.id === id)?.label ?? id)
      .join("; ");
  }
  if (field.kind === "checkbox" || field.kind === "waiver") return value ? "Yes" : "No";
  return String(value);
}

function csvEscape(v: string): string {
  if (v == null) return "";
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export default function EventResponses() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [rows, setRows] = useState<SubmissionRow[] | null>(null);
  const [selected, setSelected] = useState<SubmissionRow | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const evRes = await apiFetch(`/api/events/${id}`);
      if (!evRes.ok) {
        toast.error("Event not found");
        navigate("/admin/events");
        return;
      }
      const evData = await evRes.json();
      // Normalize camelCase
      const normalizedEvent = {
        ...evData,
        event_type: evData.eventType ?? evData.event_type,
        registration_form: evData.registrationForm ?? evData.registration_form ?? { sections: [] },
        starts_at: evData.startsAt ?? evData.starts_at,
      };
      setEvent(normalizedEvent as unknown as EventRecord);

      const subsRes = await apiFetch(`/api/event-submissions?event_id=${id}`);
      if (!subsRes.ok) {
        toast.error("Failed to load registrations");
        setRows([]);
      } else {
        const subs = await subsRes.json();
        const normalized = (subs as any[]).map((r) => ({
          ...r,
          pricing_tier_name: r.pricingTierName ?? r.pricing_tier_name,
          pricing_tier_kind: r.pricingTierKind ?? r.pricing_tier_kind,
          payment_method: r.paymentMethod ?? r.payment_method,
          payment_status: r.paymentStatus ?? r.payment_status,
          submitter_name: r.submitterName ?? r.submitter_name,
          submitter_email: r.submitterEmail ?? r.submitter_email,
          submitter_phone: r.submitterPhone ?? r.submitter_phone,
          team_name: r.teamName ?? r.team_name,
          created_at: r.createdAt ?? r.created_at,
          cancelled_at: r.cancelledAt ?? r.cancelled_at,
        }));
        setRows(normalized as SubmissionRow[]);
      }
    })();
  }, [id, navigate]);

  const fields = useMemo(() => (event ? flattenFields(event) : []), [event]);
  const label = event?.event_type === "rsvp" ? "RSVPs" : "Registrations";

  const stats = useMemo(() => {
    if (!rows) return null;
    const active = rows.filter((r) => r.status !== "cancelled");
    const paid = active.filter((r) => r.payment_status === "paid");
    const owed = active.filter((r) => r.payment_status === "owed_in_person");
    const totalCollected = paid.reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalOwed = owed.reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalHeadcount = active.reduce((s, r) => s + (Number(r.headcount) || 1), 0);
    return { active: active.length, total: rows.length, paid: paid.length, totalCollected, totalOwed, totalHeadcount };
  }, [rows]);

  function handleExport() {
    if (!rows || !event) return;
    const headers = [
      "Submitted",
      "Status",
      "Name",
      "Email",
      "Phone",
      "Team",
      "Roster",
      "Option",
      "Amount",
      "Payment method",
      "Payment status",
      ...fields.map((f) => f.label || "(untitled)"),
    ];
    const lines = [headers.map(csvEscape).join(",")];
    rows.forEach((r) => {
      const rosterStr = (r.roster ?? [])
        .map((m) => [m.name, m.email, m.notes].filter(Boolean).join(" "))
        .join(" | ");
      const cells = [
        new Date(r.created_at).toISOString(),
        r.status,
        r.submitter_name,
        r.submitter_email,
        r.submitter_phone ?? "",
        r.team_name ?? "",
        rosterStr,
        r.pricing_tier_name ?? "",
        r.amount ? Number(r.amount).toFixed(2) : "",
        r.payment_method,
        r.payment_status,
        ...fields.map((f) => answerToString(f, r.answers?.[f.id])),
      ];
      lines.push(cells.map((v) => csvEscape(String(v ?? ""))).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.slug}-${event.event_type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(row: SubmissionRow) {
    const res = await apiFetch(`/api/event-submissions/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to delete");
      return;
    }
    setRows((prev) => (prev ?? []).filter((r) => r.id !== row.id));
    toast.success("Submission deleted");
  }

  if (!event || !rows) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/events")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> All events
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-primary-darker truncate">
              {label} — {event.title}
            </h1>
            <p className="text-xs text-muted-foreground">/events/{event.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/events/${event.id}`)}>
            Edit event
          </Button>
          <Button size="sm" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {event.event_type === "rsvp" ? (
            <Stat label="People RSVP'd" value={`${stats.totalHeadcount}`} sub={`${stats.active} submission${stats.active === 1 ? "" : "s"}`} />
          ) : (
            <Stat label="Active" value={`${stats.active}`} sub={`${stats.totalHeadcount} people · of ${stats.total} total`} />
          )}
          <Stat label="Paid online" value={`${stats.paid}`} sub={`$${stats.totalCollected.toFixed(2)}`} />
          <Stat label="Pay in person" value={`${rows.filter((r) => r.payment_status === "owed_in_person" && r.status !== "cancelled").length}`} sub={`$${stats.totalOwed.toFixed(2)} owed`} />
          <Stat label="Cancelled" value={`${rows.filter((r) => r.status === "cancelled").length}`} sub="—" />
        </div>
      )}

      {rows.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center text-sm text-muted-foreground">
          No {label.toLowerCase()} yet.
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Name</th>
                {event.event_type === "rsvp" ? (
                  <th className="text-center px-4 py-3"># People</th>
                ) : (
                  <>
                    <th className="text-left px-4 py-3">Option</th>
                    <th className="text-left px-4 py-3">Payment</th>
                  </>
                )}
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    <div>{new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(r)}
                      className="font-semibold text-primary-darker hover:underline text-left"
                    >
                      {r.team_name ?? r.submitter_name}
                    </button>
                    <div className="text-xs text-muted-foreground">
                      {r.team_name ? `Captain: ${r.submitter_name} · ` : ""}{r.submitter_email}
                    </div>
                  </td>
                  {event.event_type === "rsvp" ? (
                    <td className="px-4 py-3 text-center font-semibold">
                      {Number(r.headcount) || 1}
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        {r.pricing_tier_name ? (
                          <>
                            {r.pricing_tier_name}
                            {Number(r.amount) > 0 && (
                              <div className="text-xs text-muted-foreground">${Number(r.amount).toFixed(2)}</div>
                            )}
                          </>
                        ) : Number(r.amount) > 0 ? (
                          `$${Number(r.amount).toFixed(2)}`
                        ) : (
                          "Free"
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="capitalize">{r.payment_method.replace("_", " ")}</span>
                        {r.payment_method !== "free" && r.payment_status && (
                          <div
                            className={`capitalize ${
                              r.payment_status === "paid"
                                ? "text-emerald-700"
                                : r.payment_status === "owed_in_person"
                                ? "text-amber-700"
                                : "text-muted-foreground"
                            }`}
                          >
                            {r.payment_status.replace(/_/g, " ")}
                          </div>
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-xs">
                    {r.status === "cancelled" ? (
                      <span className="text-destructive font-medium">Cancelled</span>
                    ) : r.status === "confirmed" ? (
                      <span className="text-emerald-700 font-medium">Confirmed</span>
                    ) : (
                      <span className="text-muted-foreground capitalize">{r.status}</span>
                    )}
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
                          <AlertDialogTitle>Delete this submission?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes the record. This cannot be undone.
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected?.team_name ? `${selected.team_name}` : selected?.submitter_name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <SubmissionDetail row={selected} fields={fields} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-primary-darker">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function SubmissionDetail({ row, fields }: { row: SubmissionRow; fields: FormField[] }) {
  return (
    <div className="space-y-4 text-sm">
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DRow label="Submitted" value={new Date(row.created_at).toLocaleString()} />
        <DRow label="Status" value={row.status} />
        <DRow label={row.team_name ? "Captain" : "Name"} value={row.submitter_name} />
        <DRow label="Email" value={row.submitter_email} />
        {row.submitter_phone && <DRow label="Phone" value={row.submitter_phone} />}
        {row.team_name && <DRow label="Team" value={row.team_name} />}
        {row.pricing_tier_name && <DRow label="Option" value={row.pricing_tier_name} />}
        {Number(row.amount) > 0 && (
          <>
            <DRow label="Amount" value={`$${Number(row.amount).toFixed(2)}`} />
            <DRow label="Payment" value={`${row.payment_method.replace("_", " ")} · ${row.payment_status.replace(/_/g, " ")}`} />
          </>
        )}
      </dl>

      {row.roster?.length > 0 && (
        <div>
          <p className="font-semibold mb-1">Roster ({row.roster.length})</p>
          <ul className="space-y-1">
            {row.roster.map((m, i) => (
              <li key={i} className="border rounded px-2 py-1">
                <strong>{m.name}</strong>
                {m.email ? ` · ${m.email}` : ""}
                {m.phone ? ` · ${m.phone}` : ""}
                {m.notes ? ` · ${m.notes}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {fields.length > 0 && (
        <div>
          <p className="font-semibold mb-1">Form responses</p>
          <dl className="space-y-2">
            {fields.map((f) => {
              const a = row.answers?.[f.id];
              if (a == null || a === "" || (Array.isArray(a) && a.length === 0)) return null;
              return (
                <div key={f.id} className="border-l-2 border-muted pl-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                  <dd>{answerToString(f, a)}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}
    </div>
  );
}

function DRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize-first">{value}</dd>
    </div>
  );
}
