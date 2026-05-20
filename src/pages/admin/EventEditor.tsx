import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  Lock,
  Unlock,
  X,
  ExternalLink,
  ArrowLeft,
  Undo2,
  Redo2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import EventPageView from "@/components/site/EventPageView";
import SectionPageEditor, {
  type SectionPageEditorHandle,
} from "@/components/admin/SectionPageEditor";
import PricingTiersEditor from "@/components/admin/PricingTiersEditor";
import FormBuilder from "@/components/admin/FormBuilder";
import DocumentsEditor from "@/components/admin/DocumentsEditor";
import AddressAutocomplete from "@/components/admin/AddressAutocomplete";
import { eventSectionSlug } from "@/pages/EventDetail";
import { eventStarterFor } from "@/lib/eventStarterContent";
import { getEventBySlug, updateEvent } from "@/lib/events";
import type { EventRecord, EventType } from "@/lib/types/events";

type Variant = "upcoming" | "past";

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}
function localInputToIso(v: string): string | null {
  if (!v) return null;
  return new Date(v).toISOString();
}

export default function EventEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [variant, setVariant] = useState<Variant>("upcoming");
  const [section, setSection] = useState<"page" | "form">("page");
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false, hasPending: false });
  const savedRef = useRef<EventRecord | null>(null);
  const sectionRef = useRef<SectionPageEditorHandle>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const parsed = await getEventBySlug(id);
      if (!parsed) {
        toast.error("Event not found");
        navigate("/admin/events");
        return;
      }
      savedRef.current = parsed;
      setEvent(parsed);
      // Default the preview tab to whichever the event currently is.
      const now = new Date();
      const end = parsed.ends_at ? new Date(parsed.ends_at) : parsed.starts_at ? new Date(parsed.starts_at) : null;
      setVariant(end && end < now ? "past" : "upcoming");
      setLoading(false);
    })();
  }, [id, navigate]);

  if (loading || !event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const ev = event;
  const update = (patch: Partial<EventRecord>) =>
    setEvent((prev) => (prev ? { ...prev, ...patch } : prev));

  async function handleSave() {
    if (!event) return;
    setSaving(true);
    try {
      const token = await getToken();
      let heroUrl = event.hero_image;
      if (pendingImage) {
        const ext = pendingImage.name.split(".").pop() ?? "jpg";
        const filename = `events/${event.id}-${Date.now()}.${ext}`;
        const upRes = await fetch(
          `/api/upload/image?filename=${encodeURIComponent(filename)}`,
          { method: "POST", body: pendingImage, headers: { "Content-Type": pendingImage.type, Authorization: `Bearer ${token}` } },
        );
        if (!upRes.ok) {
          const err = await upRes.json().catch(() => ({}));
          throw new Error(err.error ?? "Image upload failed");
        }
        const { url } = await upRes.json();
        heroUrl = url;
      }
      await updateEvent(event.id, {
        slug: event.slug,
        title: event.title,
        subtitle: event.subtitle,
        description: event.description,
        location: event.location,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        hero_image: heroUrl,
        registration_url: event.registration_url,
        published: event.published,
        
        event_type: event.event_type,
        cost_amount: event.cost_amount,
        cost_description: event.cost_description,
        payment_note: event.payment_note,
        registration_deadline: event.registration_deadline,
        capacity: event.capacity,
        registration_open: event.registration_open,
        recap: event.recap,
        page_content: event.page_content,
        pricing_tiers: event.pricing_tiers,
        registration_form: event.registration_form,
        organizer_name: event.organizer_name,
        organizer_email: event.organizer_email,
        organizer_phone: event.organizer_phone,
        documents: event.documents,
      });
      // Persist the page-content sections rendered inline below the header.
      await sectionRef.current?.save();
      const next = { ...event, hero_image: heroUrl };
      savedRef.current = next;
      setEvent(next);
      setPendingImage(null);
      toast.success("Event saved");
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    if (savedRef.current) setEvent(savedRef.current);
    setPendingImage(null);
    sectionRef.current?.discard();
    setEditing(false);
  }

  // Force the preview to render past/upcoming variant by overriding starts_at/ends_at.
  const previewEvent: EventRecord = (() => {
    if (variant === "past") {
      const past = new Date(Date.now() - 30 * 86400000);
      const end = new Date(Date.now() - 30 * 86400000 + 3 * 3600000);
      return {
        ...ev,
        starts_at: past.toISOString(),
        ends_at: end.toISOString(),
      };
    }
    // Upcoming
    if (!ev.starts_at || new Date(ev.starts_at) <= new Date()) {
      const future = new Date(Date.now() + 14 * 86400000);
      const end = new Date(Date.now() + 14 * 86400000 + 3 * 3600000);
      return {
        ...ev,
        starts_at: ev.starts_at && new Date(ev.starts_at) > new Date()
          ? ev.starts_at
          : future.toISOString(),
        ends_at: ev.ends_at && new Date(ev.ends_at) > new Date()
          ? ev.ends_at
          : end.toISOString(),
      };
    }
    return ev;
  })();

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/90 backdrop-blur border-b flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/events")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> All events
          </Button>
          <div className="min-w-0 flex items-center gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-primary-darker truncate">
                {ev.title || "Untitled event"}
              </h1>
              <p className="text-xs text-muted-foreground">
                /events/{ev.slug}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/40">
              <Label className="text-xs font-medium">Published</Label>
              <Switch
                checked={ev.published}
                onCheckedChange={(v) => update({ published: v })}
                disabled={!editing}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing ? (
            <Button onClick={() => setEditing(true)} size="sm">
              <Lock className="mr-2 h-4 w-4" /> Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sectionRef.current?.undo()}
                disabled={!history.canUndo}
                title="Undo (⌘Z)"
                aria-label="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sectionRef.current?.redo()}
                disabled={!history.canRedo}
                title="Redo (⌘⇧Z)"
                aria-label="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!history.hasPending && !pendingImage} title="Reset to last saved">
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will revert the event to the last saved version. You can't undo this.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep editing</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { sectionRef.current?.reset(); if (savedRef.current) setEvent(savedRef.current); setPendingImage(null); }}>Reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" size="sm" onClick={discard} disabled={saving}>
                <X className="mr-2 h-4 w-4" /> Cancel
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

      {/* Settings — top, full width */}
      <div className="bg-white border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-primary-darker mb-3">Event settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Slug (URL)</Label>
            <Input
              value={ev.slug}
              onChange={(e) => update({ slug: e.target.value })}
              disabled={!editing}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Event type</Label>
            <Select
              value={ev.event_type}
              onValueChange={(v) => update({ event_type: v as EventType })}
              disabled={!editing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registration">Registration Required</SelectItem>
                <SelectItem value="rsvp">RSVP Required</SelectItem>
                <SelectItem value="dropin">Drop-in</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Starts</Label>
            <Input
              type="datetime-local"
              value={isoToLocalInput(ev.starts_at)}
              onChange={(e) => {
                const startsIso = localInputToIso(e.target.value);
                const patch: Partial<EventRecord> = { starts_at: startsIso };
                if (startsIso && ev.ends_at && new Date(ev.ends_at) < new Date(startsIso)) {
                  patch.ends_at = startsIso;
                }
                if (startsIso && ev.registration_deadline) {
                  const startDate = startsIso.slice(0, 10);
                  if (ev.registration_deadline > startDate) patch.registration_deadline = startDate;
                }
                update(patch);
              }}
              disabled={!editing}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ends</Label>
            <Input
              type="datetime-local"
              value={isoToLocalInput(ev.ends_at)}
              onChange={(e) => {
                const endsIso = localInputToIso(e.target.value);
                const patch: Partial<EventRecord> = { ends_at: endsIso };
                if (endsIso && ev.starts_at && new Date(ev.starts_at) > new Date(endsIso)) {
                  patch.starts_at = endsIso;
                  const endDate = endsIso.slice(0, 10);
                  if (ev.registration_deadline && ev.registration_deadline > endDate) {
                    patch.registration_deadline = endDate;
                  }
                }
                update(patch);
              }}
              disabled={!editing}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cost (USD)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={ev.cost_amount ?? ""}
              onChange={(e) =>
                update({ cost_amount: e.target.value === "" ? null : parseFloat(e.target.value) })
              }
              disabled={!editing}
              placeholder="0 = Free, blank = hide"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cost subtext (optional)</Label>
            <Input
              value={ev.cost_description ?? ""}
              onChange={(e) => update({ cost_description: e.target.value || null })}
              disabled={!editing}
              placeholder="e.g. at the door, per team"
            />
          </div>
          {ev.event_type !== "dropin" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Registration deadline</Label>
                <Input
                  type="date"
                  value={ev.registration_deadline ?? ""}
                  onChange={(e) => {
                    const deadline = e.target.value || null;
                    const patch: Partial<EventRecord> = { registration_deadline: deadline };
                    if (deadline && ev.starts_at) {
                      const startDate = ev.starts_at.slice(0, 10);
                      if (deadline > startDate) {
                        // Push starts (and ends) out so deadline ≤ starts ≤ ends.
                        const newStartIso = `${deadline}T${ev.starts_at.slice(11)}`;
                        patch.starts_at = newStartIso;
                        if (ev.ends_at && new Date(ev.ends_at) < new Date(newStartIso)) {
                          patch.ends_at = newStartIso;
                        }
                      }
                    }
                    update(patch);
                  }}
                  disabled={!editing}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Capacity (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  value={ev.capacity ?? ""}
                  onChange={(e) =>
                    update({
                      capacity: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  disabled={!editing}
                  placeholder="No limit"
                />
              </div>
              <div className="flex items-center justify-between gap-2 pt-5">
                <Label className="text-xs">{ev.event_type === "rsvp" ? "RSVP open" : "Registration open"}</Label>
                <Switch
                  checked={ev.registration_open}
                  onCheckedChange={(v) => update({ registration_open: v })}
                  disabled={!editing}
                />
              </div>
            </>
          )}
          <div className="space-y-1 md:col-span-2 lg:col-span-4">
            <Label className="text-xs">Address / venue</Label>
            <AddressAutocomplete
              value={ev.location ?? ""}
              onChange={(v) => update({ location: v || null })}
              disabled={!editing}
              placeholder="Start typing a venue or address…"
            />
          </div>
          {ev.event_type === "registration" && (
            <div className="space-y-1 md:col-span-2 lg:col-span-4">
              <Label className="text-xs">Payment note (optional)</Label>
              <Input
                value={ev.payment_note ?? ""}
                onChange={(e) => update({ payment_note: e.target.value || null })}
                disabled={!editing}
                placeholder="e.g. Payment due at registration via PayPal or in person"
              />
            </div>
          )}
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Organizer name</Label>
            <Input
              value={ev.organizer_name ?? ""}
              onChange={(e) => update({ organizer_name: e.target.value || null })}
              disabled={!editing}
              placeholder="e.g. Jane Smith"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Organizer email</Label>
            <Input
              type="email"
              value={ev.organizer_email ?? ""}
              onChange={(e) => update({ organizer_email: e.target.value || null })}
              disabled={!editing}
              placeholder="contact@..."
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Organizer phone</Label>
            <Input
              value={ev.organizer_phone ?? ""}
              onChange={(e) => update({ organizer_phone: e.target.value || null })}
              disabled={!editing}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-1 md:col-span-2 lg:col-span-4">
            <Label className="text-xs">Documents (shown in sidebar)</Label>
            <DocumentsEditor
              files={ev.documents}
              onChange={(documents) => update({ documents })}
              disabled={!editing}
            />
          </div>
        </div>
      </div>

      {ev.event_type === "dropin" ? (
        <PagePreviewBlock
          ev={ev}
          previewEvent={previewEvent}
          editing={editing}
          variant={variant}
          setVariant={setVariant}
          update={update}
          setPendingImage={setPendingImage}
          sectionRef={sectionRef}
          setHistory={setHistory}
        />
      ) : (
        <Tabs value={section} onValueChange={(v) => setSection(v as typeof section)}>
          <TabsList>
            <TabsTrigger value="page">Event page</TabsTrigger>
            <TabsTrigger value="form">
              {ev.event_type === "registration" ? "Pricing & form" : "RSVP form"}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="page" className="space-y-4 mt-4">
            <PagePreviewBlock
              ev={ev}
              previewEvent={previewEvent}
              editing={editing}
              variant={variant}
              setVariant={setVariant}
              update={update}
              setPendingImage={setPendingImage}
              sectionRef={sectionRef}
              setHistory={setHistory}
            />
          </TabsContent>
          <TabsContent value="form" className="space-y-4 mt-4">
            {ev.event_type === "registration" && (
              <PricingTiersEditor
                tiers={ev.pricing_tiers}
                editing={editing}
                onChange={(tiers) => update({ pricing_tiers: tiers })}
              />
            )}
            <FormBuilder
              form={ev.registration_form}
              editing={editing}
              event={ev}
              onChange={(form) => update({ registration_form: form })}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

interface PagePreviewBlockProps {
  ev: EventRecord;
  previewEvent: EventRecord;
  editing: boolean;
  variant: Variant;
  setVariant: (v: Variant) => void;
  update: (patch: Partial<EventRecord>) => void;
  setPendingImage: (f: File | null) => void;
  sectionRef: React.RefObject<SectionPageEditorHandle>;
  setHistory: (h: { canUndo: boolean; canRedo: boolean; hasPending: boolean }) => void;
}

function PagePreviewBlock({
  ev,
  previewEvent,
  editing,
  variant,
  setVariant,
  update,
  setPendingImage,
  sectionRef,
  setHistory,
}: PagePreviewBlockProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={variant} onValueChange={(v) => setVariant(v as Variant)}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming view</TabsTrigger>
            <TabsTrigger value="past">Past view</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground max-w-xl text-right">
          The Past view automatically replaces the Upcoming view once the event's end time passes — configure both ahead of time.
        </p>
      </div>

      <div
        className={`rounded-lg border shadow-sm overflow-hidden bg-[hsl(0_0%_98%)] ${
          editing ? "ring-2 ring-primary/40" : ""
        }`}
      >
        <EventPageView
          event={previewEvent}
          editing={editing}
          onChange={update}
          onImageFile={setPendingImage}
        >
          <SectionPageEditor
            ref={sectionRef}
            key={`${ev.id}-${variant}`}
            slug={eventSectionSlug(ev.id, variant)}
            toolbarTitle={`Sections (${variant})`}
            embedded
            editing={editing}
            hideTitle
            newPageStarter={eventStarterFor(variant)}
            onHistoryChange={setHistory}
          />
        </EventPageView>
      </div>
    </>
  );
}
