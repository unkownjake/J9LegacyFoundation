import { useEffect, useMemo, useState } from "react";
import { Loader2, Download, Plus, CheckCircle2, Circle, Trash2, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getPageContent, savePageContent } from "@/lib/cms";
import { emptyDonateContent, type DonatePageContent } from "@/lib/types/donate";

interface DonationRow {
  id: string;
  source: string;
  environment: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  fees_covered: number;
  net_amount: number | null;
  currency: string;
  status: string;
  paypal_order_id: string | null;
  captured_at: string | null;
  thanked_at: string | null;
  notes: string | null;
  created_at: string;
}

const SOURCE_COLORS: Record<string, string> = {
  paypal: "bg-blue-100 text-blue-800",
  venmo: "bg-sky-100 text-sky-800",
  zelle: "bg-purple-100 text-purple-800",
  manual: "bg-gray-100 text-gray-800",
};

export default function DonationsAdmin() {
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DonationRow | null>(null);

  async function load() {
    setLoading(true);
    const res = await apiFetch("/api/donations");
    if (!res.ok) {
      toast.error("Failed to load donations");
      setLoading(false);
      return;
    }
    const data = await res.json();
    // Normalize camelCase from Drizzle to the expected snake_case shape
    const normalized = (data as any[]).map((r) => ({
      ...r,
      donor_name: r.donorName ?? r.donor_name ?? null,
      donor_email: r.donorEmail ?? r.donor_email ?? null,
      fees_covered: r.feesCovered ?? r.fees_covered ?? 0,
      net_amount: r.netAmount ?? r.net_amount ?? null,
      paypal_order_id: r.paypalOrderId ?? r.paypal_order_id ?? null,
      captured_at: r.capturedAt ?? r.captured_at ?? null,
      thanked_at: r.thankedAt ?? r.thanked_at ?? null,
      created_at: r.createdAt ?? r.created_at,
    }));
    setRows(normalized as DonationRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const completed = rows.filter((r) => r.status === "completed");
    const sum = completed.reduce((s, r) => s + Number(r.amount), 0);
    const net = completed.reduce((s, r) => s + Number(r.net_amount ?? r.amount), 0);
    return {
      count: completed.length,
      sum,
      net,
      pendingThanks: completed.filter((r) => !r.thanked_at).length,
    };
  }, [rows]);

  async function toggleThanked(row: DonationRow) {
    const next = row.thanked_at ? null : new Date().toISOString();
    const res = await apiFetch(`/api/donations/${row.id}`, {
      method: "PUT",
      body: JSON.stringify({ thanked_at: next }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return toast.error(err.error ?? "Failed to update");
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, thanked_at: next } : r)));
  }

  async function saveNotes(row: DonationRow, notes: string) {
    const res = await apiFetch(`/api/donations/${row.id}`, {
      method: "PUT",
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return toast.error(err.error ?? "Failed to save notes");
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, notes } : r)));
    toast.success("Notes saved");
  }

  async function deleteRow(row: DonationRow) {
    if (!confirm("Delete this donation record? This cannot be undone.")) return;
    // No delete endpoint — soft approach: just reload (deletion not critical for donations)
    toast.error("Donation deletion is not supported via API. Use the database directly.");
  }

  function exportCsv() {
    const header = [
      "created_at",
      "source",
      "environment",
      "donor_name",
      "donor_email",
      "amount",
      "fees_covered",
      "net_amount",
      "status",
      "paypal_order_id",
      "thanked_at",
      "notes",
    ];
    const lines = [header.join(",")].concat(
      rows.map((r) =>
        header
          .map((h) => {
            const v = (r as any)[h];
            if (v == null) return "";
            const s = String(v).replace(/"/g, '""');
            return /[",\n]/.test(s) ? `"${s}"` : s;
          })
          .join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-darker">Donations</h1>
          <p className="text-sm text-muted-foreground">
            Track donations, mark thank-yous, and log Zelle/manual entries.
          </p>
        </div>
        <div className="flex gap-2">
          <PaymentSettingsDialog />
          <ManualEntryDialog onSaved={load} />
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total donations" value={totals.count.toString()} />
        <Stat label="Gross raised" value={`$${totals.sum.toFixed(2)}`} />
        <Stat label="Net received" value={`$${totals.net.toFixed(2)}`} />
        <Stat label="Pending thank-yous" value={totals.pendingThanks.toString()} />
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No donations yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Thanked?</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(new Date(r.created_at), "MMM d, yyyy")}
                    {r.environment === "sandbox" && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        TEST
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded ${
                        SOURCE_COLORS[r.source] ?? "bg-gray-100"
                      }`}
                    >
                      {r.source}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{r.donor_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.donor_email ?? ""}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="font-semibold">${Number(r.amount).toFixed(2)}</div>
                    {Number(r.fees_covered) > 0 && (
                      <div className="text-[11px] text-muted-foreground">
                        +${Number(r.fees_covered).toFixed(2)} fees
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "completed" ? "default" : "secondary"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleThanked(r)}
                      className="flex items-center gap-1 text-xs hover:text-primary"
                    >
                      {r.thanked_at ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          {format(new Date(r.thanked_at), "MMM d")}
                        </>
                      ) : (
                        <>
                          <Circle className="h-4 w-4" />
                          Mark thanked
                        </>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                      Notes
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteRow(r)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <NotesDialog
        row={editing}
        onClose={() => setEditing(null)}
        onSave={(notes) => editing && saveNotes(editing, notes)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-primary-darker mt-1">{value}</div>
    </div>
  );
}

function NotesDialog({
  row,
  onClose,
  onSave,
}: {
  row: DonationRow | null;
  onClose: () => void;
  onSave: (notes: string) => void;
}) {
  const [notes, setNotes] = useState("");
  useEffect(() => setNotes(row?.notes ?? ""), [row]);
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Donation notes</DialogTitle>
        </DialogHeader>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="Internal notes about this donation…"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(notes);
              onClose();
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<DonatePageContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || content) return;
    getPageContent<DonatePageContent>("donate").then((data) => {
      setContent({
        ...emptyDonateContent,
        ...(data ?? {}),
        paypalCheckout: { ...emptyDonateContent.paypalCheckout, ...(data?.paypalCheckout ?? {}) },
        zelle: { ...emptyDonateContent.zelle, ...(data?.zelle ?? {}) },
        amounts: Array.isArray(data?.amounts) ? data!.amounts : emptyDonateContent.amounts,
      });
    });
  }, [open]);

  const update = (patch: Partial<DonatePageContent>) =>
    setContent((prev) => prev ? { ...prev, ...patch } : prev);

  async function save() {
    if (!content) return;
    setSaving(true);
    try {
      await savePageContent("donate", content);
      toast.success("Payment settings saved");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="mr-2 h-4 w-4" /> Payment settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment settings</DialogTitle>
        </DialogHeader>
        {!content ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-5">
            <section>
              <Label className="text-sm">Preset amounts (USD)</Label>
              <div className="space-y-2 mt-2">
                {content.amounts.map((amt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      value={amt}
                      onChange={(e) => {
                        const next = [...content.amounts];
                        next[i] = e.target.value;
                        update({ amounts: next });
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => update({ amounts: content.amounts.filter((_, j) => j !== i) })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => update({ amounts: [...content.amounts, "100"] })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add amount
                </Button>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Default amount</Label>
                <Input
                  value={content.defaultAmount}
                  onChange={(e) => update({ defaultAmount: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Cover-fees % surcharge</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={content.feePercent}
                  onChange={(e) => update({ feePercent: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </section>

            <section className="border rounded-md p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">PayPal / Card</span>
                <Switch
                  checked={content.paypalCheckout.enabled}
                  onCheckedChange={(v) =>
                    update({ paypalCheckout: { ...content.paypalCheckout, enabled: v } })
                  }
                />
              </div>
              {content.paypalCheckout.enabled && (
                <>
                  <div>
                    <Label className="text-xs">Environment</Label>
                    <select
                      className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
                      value={content.paypalCheckout.environment}
                      onChange={(e) =>
                        update({
                          paypalCheckout: {
                            ...content.paypalCheckout,
                            environment: e.target.value as "sandbox" | "live",
                          },
                        })
                      }
                    >
                      <option value="sandbox">Sandbox (test)</option>
                      <option value="live">Live</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Public Client ID</Label>
                    <Input
                      value={content.paypalCheckout.clientId}
                      onChange={(e) =>
                        update({
                          paypalCheckout: { ...content.paypalCheckout, clientId: e.target.value },
                        })
                      }
                      placeholder="From PayPal Developer dashboard"
                      className="mt-1 font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must match the <code>PAYPAL_CLIENT_ID</code> backend env var.
                    </p>
                  </div>
                </>
              )}
            </section>

            <section className="border rounded-md p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Zelle</span>
                <Switch
                  checked={content.zelle.enabled}
                  onCheckedChange={(v) => update({ zelle: { ...content.zelle, enabled: v } })}
                />
              </div>
              {content.zelle.enabled && (
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={content.zelle.email}
                    onChange={(e) => update({ zelle: { ...content.zelle, email: e.target.value } })}
                    className="mt-1"
                  />
                </div>
              )}
            </section>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !content}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManualEntryDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    source: "zelle" as "zelle" | "manual" | "paypal" | "venmo",
    donor_name: "",
    donor_email: "",
    amount: "",
    notes: "",
  });

  async function save() {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    setSaving(true);
    const res = await apiFetch("/api/donations/manual", {
      method: "POST",
      body: JSON.stringify({
        source: form.source,
        environment: "live",
        donor_name: form.donor_name || null,
        donor_email: form.donor_email || null,
        amount: amt,
        net_amount: amt,
        status: "completed",
        captured_at: new Date().toISOString(),
        notes: form.notes || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return toast.error(err.error ?? "Failed to log donation");
    }
    toast.success("Donation logged");
    setOpen(false);
    setForm({ source: "zelle", donor_name: "", donor_email: "", amount: "", notes: "" });
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Log donation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a manual donation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Source</Label>
            <select
              className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value as any })}
            >
              <option value="zelle">Zelle</option>
              <option value="manual">Other / Cash / Check</option>
              <option value="paypal">PayPal (manual)</option>
              <option value="venmo">Venmo (manual)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Donor name</Label>
              <Input
                value={form.donor_name}
                onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm">Donor email</Label>
              <Input
                type="email"
                value={form.donor_email}
                onChange={(e) => setForm({ ...form, donor_email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label className="text-sm">Amount (USD)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-sm">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
