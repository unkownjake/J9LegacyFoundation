import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, Trash2, Calendar, ExternalLink, Inbox, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createEvent,
  deleteEvent,
  eventSlugFromTitle,
  listAllEvents,
} from "@/lib/events";
import type { EventRecord, EventType } from "@/lib/types/events";

const TYPE_LABELS: Record<EventType, string> = {
  registration: "Registration Required",
  rsvp: "RSVP Required",
  dropin: "Drop-in",
};

export default function EventsAdmin() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRecord[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<EventType>("dropin");

  useEffect(() => {
    listAllEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  async function handleCreate() {
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    try {
      const slug = eventSlugFromTitle(title);
      const created = await createEvent({ title, slug, event_type: newType });
      toast.success("Event created");
      setAddOpen(false);
      setNewTitle("");
      setNewType("dropin");
      navigate(`/admin/events/${created.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create event");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(ev: EventRecord) {
    if (!confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    try {
      await deleteEvent(ev.id);
      setEvents((prev) => (prev ?? []).filter((e) => e.id !== ev.id));
      toast.success("Event deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    }
  }

  if (!events) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary-darker">Event Management</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, publish, and manage events.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New event
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No events yet. Click <strong>New event</strong> to create your first one.
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/events/${e.id}`}
                      className="font-semibold text-primary-darker hover:underline"
                    >
                      {e.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">/{e.slug}</div>
                  </td>
                  <td className="px-4 py-3">{TYPE_LABELS[e.event_type]}</td>
                  <td className="px-4 py-3">
                    {e.starts_at
                      ? new Date(e.starts_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {e.published ? (
                      <span className="text-emerald-700 font-medium">Published</span>
                    ) : (
                      <span className="text-muted-foreground">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <TooltipProvider delayDuration={150}>
                      <div className="inline-flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              to={`/admin/events/${e.id}`}
                              className="p-2 rounded hover:bg-muted text-muted-foreground"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Edit event</TooltipContent>
                        </Tooltip>
                        {e.event_type !== "dropin" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                to={`/admin/events/${e.id}/responses`}
                                className="p-2 rounded hover:bg-muted text-muted-foreground"
                              >
                                <Inbox className="h-4 w-4" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              {e.event_type === "rsvp" ? "View RSVPs" : "View registrations"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {e.published && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={`/events/${e.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded hover:bg-muted text-muted-foreground"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>View public page</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleDelete(e)}
                              className="p-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Delete event</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new event</DialogTitle>
            <DialogDescription>
              You can edit all the details after creating it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. 2026 Memorial Lacrosse Jamboree"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label>Event type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as EventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registration">
                    Registration Required (paid signup)
                  </SelectItem>
                  <SelectItem value="rsvp">RSVP Required (free signup)</SelectItem>
                  <SelectItem value="dropin">Drop-in (no signup)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
