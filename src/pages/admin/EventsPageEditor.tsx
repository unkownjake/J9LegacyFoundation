import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Lock,
  Unlock,
  X,
  Calendar,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import InlineEditable from "@/components/admin/InlineEditable";
import EventCard from "@/components/site/EventCard";
import { getPageContent, savePageContent } from "@/lib/cms";
import { listAllEvents } from "@/lib/events";
import {
  emptyEventsPageContent,
  type EventRecord,
  type EventsPageContent,
} from "@/lib/types/events";

type ViewMode = "normal" | "in-progress" | "empty";

function placeholderEvent(overrides: Partial<EventRecord>): EventRecord {
  return {
    id: "preview",
    slug: "preview",
    title: "Event title",
    subtitle: null,
    description: null,
    location: "Location, City, ST",
    starts_at: null,
    ends_at: null,
    hero_image: null,
    registration_url: null,
    published: true,
    sort_order: 0,
    event_type: "dropin",
    cost_amount: null,
    cost_description: null,
    payment_note: null,
    registration_deadline: null,
    capacity: null,
    registration_open: true,
    recap: null,
    page_content: {},
    pricing_tiers: [],
    registration_form: { sections: [] },
    organizer_name: null,
    organizer_email: null,
    organizer_phone: null,
    documents: [],
    ...overrides,
  };
}

const placeholderUpcoming: EventRecord[] = [
  placeholderEvent({
    id: "preview-up-1",
    slug: "preview-1",
    title: "Upcoming event title",
    description: "A short description of this upcoming event.",
    starts_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    ends_at: new Date(Date.now() + 7 * 86400000 + 3 * 3600000).toISOString(),
  }),
];

const placeholderPast: EventRecord[] = [
  placeholderEvent({
    id: "preview-past-1",
    slug: "preview-2",
    title: "Past event title",
    description: "A short description of this past event.",
    starts_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    ends_at: new Date(Date.now() - 30 * 86400000 + 3 * 3600000).toISOString(),
  }),
];

const placeholderInProgress: EventRecord = placeholderEvent({
  id: "preview-now-1",
  slug: "preview-now",
  title: "Event in progress",
  description: "Happening right now.",
  starts_at: new Date(Date.now() - 3600000).toISOString(),
  ends_at: new Date(Date.now() + 3600000).toISOString(),
});

export default function EventsPageEditor() {
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<EventsPageContent>(emptyEventsPageContent);
  const [view, setView] = useState<ViewMode>("normal");
  const [realEvents, setRealEvents] = useState<EventRecord[]>([]);
  const savedRef = useRef<EventsPageContent>(emptyEventsPageContent);

  useEffect(() => {
    getPageContent<EventsPageContent>("events").then((data) => {
      const safe: EventsPageContent = {
        ...emptyEventsPageContent,
        ...(data ?? {}),
        inProgress: { ...emptyEventsPageContent.inProgress, ...(data?.inProgress ?? {}) },
        empty: { ...emptyEventsPageContent.empty, ...(data?.empty ?? {}) },
      };
      savedRef.current = safe;
      setContent(safe);
      setLoaded(true);
    });
    listAllEvents().then(setRealEvents).catch(() => setRealEvents([]));
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const update = (patch: Partial<EventsPageContent>) =>
    setContent((prev) => ({ ...prev, ...patch }));
  const updateInProgress = (patch: Partial<EventsPageContent["inProgress"]>) =>
    setContent((prev) => ({ ...prev, inProgress: { ...prev.inProgress, ...patch } }));
  const updateEmpty = (patch: Partial<EventsPageContent["empty"]>) =>
    setContent((prev) => ({ ...prev, empty: { ...prev.empty, ...patch } }));

  async function handleSave() {
    setSaving(true);
    try {
      await savePageContent("events", content);
      savedRef.current = content;
      toast.success("Events page saved");
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setContent(savedRef.current);
    setEditing(false);
  }

  // In edit mode we always show full headers (Upcoming + Past) with placeholders
  // when no real events exist, so admin can edit those headers.
  const showUpcoming = editing
    ? placeholderUpcoming
    : realEvents.filter(
        (e) => e.starts_at && new Date(e.starts_at) > new Date(),
      );
  const showPast = editing
    ? placeholderPast
    : realEvents.filter(
        (e) => !e.starts_at || new Date(e.ends_at ?? e.starts_at) < new Date(),
      );
  const inProgressEvent = editing
    ? placeholderInProgress
    : realEvents.find((e) => {
        const now = new Date();
        const s = e.starts_at ? new Date(e.starts_at) : null;
        const en = e.ends_at ? new Date(e.ends_at) : s;
        return s && en && s <= now && en >= now;
      });

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/90 backdrop-blur border-b flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-primary-darker truncate">Events page</h1>
          <p className="text-xs text-muted-foreground">
            {editing
              ? "Edit mode — click any text to change it. Use the tabs to edit each variant."
              : "Click Edit to make changes."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing ? (
            <Button onClick={() => setEditing(true)} size="sm">
              <Lock className="mr-2 h-4 w-4" /> Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={discard} disabled={saving}>
                <X className="mr-2 h-4 w-4" /> Discard
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unlock className="mr-2 h-4 w-4" />
                )}
                Save changes
              </Button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="normal">Normal (upcoming/past)</TabsTrigger>
            <TabsTrigger value="in-progress">Event in progress</TabsTrigger>
            <TabsTrigger value="empty">No events</TabsTrigger>
          </TabsList>
          <TabsContent value="normal" />
          <TabsContent value="in-progress" />
          <TabsContent value="empty" />
        </Tabs>
      )}

      <div className={`rounded-lg border shadow-sm ${editing ? "ring-2 ring-primary/40" : ""}`}>
        <article className="bg-[hsl(0_0%_98%)] min-h-[60vh]">
          <div className="container mx-auto px-4 py-10 max-w-6xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-4 leading-tight flex items-center gap-3">
              <Calendar className="h-9 w-9 flex-shrink-0" />
              <InlineEditable
                as="span"
                value={content.title}
                editable={editing}
                onChange={(v) => update({ title: v })}
                placeholder="Page title"
              />
            </h1>
            {(editing || content.intro) && (
              <InlineEditable
                as="p"
                className="text-base lg:text-lg text-foreground/85 leading-relaxed mb-8 block max-w-3xl whitespace-pre-wrap"
                value={content.intro}
                editable={editing}
                multiline
                placeholder={editing ? "Optional intro paragraph…" : ""}
                onChange={(v) => update({ intro: v })}
              />
            )}

            {(!editing && inProgressEvent) || (editing && view === "in-progress") ? (
              <section className="mt-6 bg-accent/10 border-2 border-accent rounded-xl p-6 md:p-8">
                <InlineEditable
                  as="span"
                  className="inline-block bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-3"
                  value={content.inProgress.badge}
                  editable={editing}
                  onChange={(v) => updateInProgress({ badge: v })}
                  placeholder="Badge"
                />
                <InlineEditable
                  as="h2"
                  className="text-2xl md:text-3xl font-bold text-primary mb-2 block"
                  value={content.inProgress.title}
                  editable={editing}
                  onChange={(v) => updateInProgress({ title: v })}
                  placeholder="In-progress title"
                />
                <InlineEditable
                  as="p"
                  className="text-foreground/85 mb-6 block whitespace-pre-wrap"
                  value={content.inProgress.intro}
                  editable={editing}
                  multiline
                  onChange={(v) => updateInProgress({ intro: v })}
                  placeholder="In-progress intro"
                />
                {inProgressEvent && (
                  <div className="max-w-md">
                    <EventCard event={inProgressEvent} />
                  </div>
                )}
              </section>
            ) : null}

            {(!editing && !inProgressEvent && realEvents.length === 0) ||
            (editing && view === "empty") ? (
              <section className="mt-6 bg-white border rounded-xl p-10 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <InlineEditable
                  as="h2"
                  className="text-2xl font-bold text-primary-darker mb-2 block"
                  value={content.empty.title}
                  editable={editing}
                  onChange={(v) => updateEmpty({ title: v })}
                  placeholder="Empty-state title"
                />
                <InlineEditable
                  as="p"
                  className="text-foreground/80 block whitespace-pre-wrap"
                  value={content.empty.intro}
                  editable={editing}
                  multiline
                  onChange={(v) => updateEmpty({ intro: v })}
                  placeholder="Empty-state intro"
                />
              </section>
            ) : null}

            {((!editing && !inProgressEvent && realEvents.length > 0) ||
              (editing && view === "normal")) && (
              <>
                {(showUpcoming.length > 0 || editing) && (
                  <section className="mt-10">
                    <InlineEditable
                      as="h2"
                      className="text-2xl font-bold text-primary-darker mb-4 block"
                      value={content.upcomingHeading}
                      editable={editing}
                      onChange={(v) => update({ upcomingHeading: v })}
                      placeholder="Upcoming heading"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {showUpcoming.map((e) => (
                        <EventCard key={e.id} event={e} />
                      ))}
                    </div>
                  </section>
                )}
                {(showPast.length > 0 || editing) && (
                  <section className="mt-10">
                    <InlineEditable
                      as="h2"
                      className="text-2xl font-bold text-primary-darker mb-4 block"
                      value={content.pastHeading}
                      editable={editing}
                      onChange={(v) => update({ pastHeading: v })}
                      placeholder="Past heading"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {showPast.map((e) => (
                        <EventCard key={e.id} event={e} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {editing && (
              <p className="mt-10 text-xs text-muted-foreground italic">
                Note: Event cards shown above are placeholders. Real events are managed
                separately in <strong>Event Management</strong>. This editor only manages
                the page's text and the layout for the in-progress and empty states.
              </p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
