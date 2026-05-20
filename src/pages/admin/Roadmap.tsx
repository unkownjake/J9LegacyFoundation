import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type RoadmapItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const CATEGORIES = ["email", "payments", "integrations", "events", "general"];
const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["planned", "in_progress", "blocked", "done"];

const STATUS_VARIANTS: Record<string, string> = {
  planned: "bg-muted text-foreground",
  in_progress: "bg-primary/15 text-primary",
  blocked: "bg-destructive/15 text-destructive",
  done: "bg-green-500/15 text-green-700",
};
const PRIORITY_VARIANTS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/15 text-blue-700",
  high: "bg-orange-500/15 text-orange-700",
  critical: "bg-destructive/15 text-destructive",
};

const emptyDraft = {
  id: "",
  title: "",
  description: "",
  category: "general",
  priority: "medium",
  status: "planned",
  notes: "",
  sort_order: 0,
};

export default function Roadmap() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/feature-roadmap");
    if (!res.ok) {
      toast.error("Failed to load roadmap");
      setLoading(false);
      return;
    }
    const data = await res.json();
    const normalized = (data as any[]).map((r) => ({
      ...r,
      sort_order: r.sortOrder ?? r.sort_order ?? 0,
      created_at: r.createdAt ?? r.created_at,
      updated_at: r.updatedAt ?? r.updated_at,
    }));
    setItems(normalized as RoadmapItem[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setDraft({ ...emptyDraft, sort_order: (items.at(-1)?.sort_order ?? 0) + 10 });
    setOpen(true);
  }

  function openEdit(item: RoadmapItem) {
    setDraft({
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      category: item.category,
      priority: item.priority,
      status: item.status,
      notes: item.notes ?? "",
      sort_order: item.sort_order,
    });
    setOpen(true);
  }

  async function save() {
    if (!draft.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      category: draft.category,
      priority: draft.priority,
      status: draft.status,
      notes: draft.notes.trim() || null,
      sort_order: Number(draft.sort_order) || 0,
    };
    const res = draft.id
      ? await apiFetch(`/api/feature-roadmap/${draft.id}`, { method: "PUT", body: JSON.stringify(payload) })
      : await apiFetch("/api/feature-roadmap", { method: "POST", body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to save");
      return;
    }
    toast.success(draft.id ? "Updated" : "Added");
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this roadmap item?")) return;
    const res = await apiFetch(`/api/feature-roadmap/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to delete");
    } else {
      toast.success("Deleted");
      load();
    }
  }

  async function quickStatus(item: RoadmapItem, status: string) {
    const res = await apiFetch(`/api/feature-roadmap/${item.id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to update status");
    } else load();
  }

  const grouped = STATUSES.map((s) => ({
    status: s,
    items: items.filter((i) => i.status === s),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-darker">Feature Roadmap</h1>
          <p className="text-sm text-muted-foreground">
            Track upcoming website features, integrations, and tasks.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Add item
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {grouped.map((group) => (
            <Card key={group.status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base capitalize flex items-center justify-between">
                  <span>{group.status.replace("_", " ")}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {group.items.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.items.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No items.</p>
                )}
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-md p-3 bg-card space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.title}</div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(item)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(item.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {item.category}
                      </Badge>
                      <Badge className={`capitalize ${PRIORITY_VARIANTS[item.priority]}`}>
                        {item.priority}
                      </Badge>
                      <Select
                        value={item.status}
                        onValueChange={(v) => quickStatus(item, v)}
                      >
                        <SelectTrigger
                          className={`h-7 text-xs w-auto px-2 capitalize ${STATUS_VARIANTS[item.status]}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground border-t pt-2 whitespace-pre-wrap">
                        <span className="font-semibold">Notes: </span>
                        {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit item" : "Add roadmap item"}</DialogTitle>
            <DialogDescription>
              Track features, integrations, and changes needed on the site.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select
                  value={draft.category}
                  onValueChange={(v) => setDraft({ ...draft, category: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select
                  value={draft.priority}
                  onValueChange={(v) => setDraft({ ...draft, priority: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft({ ...draft, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={3}
                placeholder="Implementation notes, links, blockers..."
              />
            </div>
            <div className="space-y-1">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={draft.sort_order}
                onChange={(e) =>
                  setDraft({ ...draft, sort_order: Number(e.target.value) })
                }
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
    </div>
  );
}
