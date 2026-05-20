import { useEffect, useState } from "react";
import { ChevronLeft, Calendar, Clock, MapPin, User, Mail, Phone, Users } from "lucide-react";
import { Link } from "react-router-dom";
import InlineEditable from "@/components/admin/InlineEditable";
import InlineImageEdit from "@/components/admin/InlineImageEdit";
import DocumentsList from "@/components/site/DocumentsList";
import {
  defaultEventPageContent,
  getEventStatus,
  type EventRecord,
  type EventPageContent,
} from "@/lib/types/events";

function fmtDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtTimeRange(start: string | null, end: string | null) {
  if (!start) return null;
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const s = new Date(start).toLocaleTimeString(undefined, opts);
  const e = end ? new Date(end).toLocaleTimeString(undefined, opts) : null;
  return e ? `${s} - ${e}` : s;
}

function fmtDeadline(date: string | null) {
  if (!date) return null;
  const [y, m, d] = date.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

interface EventPageViewProps {
  event: EventRecord;
  editing?: boolean;
  onChange?: (patch: Partial<EventRecord>) => void;
  onImageFile?: (file: File | null) => void;
  onCtaClick?: () => void;
  /** Customizable rows/columns content rendered in the left column under the hero. */
  children?: React.ReactNode;
}

export default function EventPageView({
  event,
  editing = false,
  onChange,
  onImageFile,
  onCtaClick,
  children,
}: EventPageViewProps) {
  const pc: Required<EventPageContent> = {
    ...defaultEventPageContent,
    ...(event.page_content ?? {}),
  };
  const status = getEventStatus(event);
  const badgeText =
    status === "past" ? pc.pastBadge : status === "in-progress" ? pc.inProgressBadge : pc.upcomingBadge;
  const badgeClasses =
    status === "in-progress"
      ? "bg-accent text-accent-foreground"
      : status === "past"
      ? "bg-muted text-foreground/70"
      : "bg-primary/10 text-primary-darker";

  const date = fmtDate(event.starts_at);
  const time = fmtTimeRange(event.starts_at, event.ends_at);
  const deadline = fmtDeadline(event.registration_deadline);

  // Attendance count for capacity display.
  const [attending, setAttending] = useState<number | null>(null);
  useEffect(() => {
    if (editing) return;
    if (event.event_type === "dropin") return;
    if (!event.id || event.id === "preview") return;
    let cancelled = false;
    fetch(`/api/events/${event.id}/attendance`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.count === "number") setAttending(data.count);
      });
    return () => {
      cancelled = true;
    };
  }, [event.id, event.event_type, editing]);

  function update<K extends keyof EventRecord>(key: K, value: EventRecord[K]) {
    onChange?.({ [key]: value } as Partial<EventRecord>);
  }
  function updatePage<K extends keyof EventPageContent>(key: K, value: EventPageContent[K]) {
    onChange?.({ page_content: { ...(event.page_content ?? {}), [key]: value } });
  }

  const hasRegisterCta = event.event_type === "registration" || event.event_type === "rsvp";
  const ctaLabel = event.event_type === "rsvp" ? pc.rsvpCta : pc.registerCta;
  const deadlinePassed = !!event.registration_deadline && new Date(event.registration_deadline).getTime() < Date.now();
  const isClosed = !event.registration_open || deadlinePassed;
  const closedLabel = event.event_type === "rsvp" ? "RSVP closed" : "Registration closed";
  const hasOrganizer = !!(event.organizer_name || event.organizer_email || event.organizer_phone);
  const hasDocuments = (event.documents ?? []).length > 0;
  const goingCount = attending ?? 0;

  return (
    <article className="bg-gradient-to-br from-peach/40 via-[hsl(0_0%_98%)] to-primary/5">
      <div className="container mx-auto px-4 pt-8 pb-0 max-w-6xl">
        <Link
          to="/events"
          className="inline-flex items-center gap-1 text-accent hover:text-accent-lighter font-medium text-sm mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          <InlineEditable
            as="span"
            value={pc.backLabel}
            editable={editing}
            onChange={(v) => updatePage("backLabel", v)}
            placeholder="Back link"
          />
        </Link>

        {/* Hero card — image as integrated backdrop */}
        <div className="relative rounded-2xl overflow-hidden mb-6 shadow-lg border border-white/40">
          {/* Backdrop image (blurred, low opacity) */}
          {event.hero_image && (
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-40"
              style={{ backgroundImage: `url(${event.hero_image})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/80 to-peach/30 backdrop-blur-sm" />

          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-0">
            <div className="p-6 md:p-10">
              <span className={`inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4 ${badgeClasses}`}>
                <InlineEditable
                  as="span"
                  value={badgeText}
                  editable={editing}
                  onChange={(v) => {
                    if (status === "past") updatePage("pastBadge", v);
                    else if (status === "in-progress") updatePage("inProgressBadge", v);
                    else updatePage("upcomingBadge", v);
                  }}
                  placeholder="Badge"
                />
              </span>

              <InlineEditable
                as="h1"
                className="text-3xl md:text-5xl font-bold text-primary-darker leading-tight mb-2 block"
                value={event.title}
                editable={editing}
                onChange={(v) => update("title", v)}
                placeholder="Event title"
              />
              {(editing || event.subtitle) && (
                <InlineEditable
                  as="p"
                  className="text-lg text-foreground/70 mb-5 block"
                  value={event.subtitle ?? ""}
                  editable={editing}
                  onChange={(v) => update("subtitle", v || null)}
                  placeholder={editing ? "Subtitle (optional)…" : ""}
                />
              )}

              {event.event_type === "dropin" && (
                <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-primary-darker font-semibold">
                    <Users className="h-4 w-4 text-accent" />
                    No RSVP required — just drop by
                  </span>
                  {(event.cost_amount != null || event.cost_description) && (
                    <span className="inline-flex items-baseline gap-1.5">
                      <span className="font-semibold text-primary-darker">Recommended donation:</span>
                      <span className="text-accent font-semibold">
                        {event.cost_amount != null
                          ? event.cost_amount === 0
                            ? "Free"
                            : `$${event.cost_amount.toFixed(2).replace(/\.00$/, "")}`
                          : null}
                        {event.cost_amount != null && event.cost_description ? " " : ""}
                        {event.cost_description && (
                          <span className="text-foreground/70 font-normal">{event.cost_description}</span>
                        )}
                      </span>
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/85">
                {(date || editing) && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
                    {date ?? <em className="text-muted-foreground">No date set</em>}
                  </span>
                )}
                {(time || editing) && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                    {time ?? <em className="text-muted-foreground">No time set</em>}
                  </span>
                )}
                {event.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                    <span>{event.location.replace(/\s*\n\s*/g, ", ")}</span>
                  </span>
                )}
              </div>

              {(event.description || editing) && (
                <InlineEditable
                  as="p"
                  className="mt-5 text-sm text-foreground/80 whitespace-pre-wrap block"
                  value={event.description ?? ""}
                  editable={editing}
                  multiline
                  onChange={(v) => update("description", v || null)}
                  placeholder={editing ? "Short description / pricing notes…" : ""}
                />
              )}
            </div>

            <div className="p-4 md:p-6 lg:pl-0 flex items-center justify-center">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-xl ring-1 ring-white/60">
                {editing ? (
                  <InlineImageEdit
                    className="absolute inset-0 w-full h-full"
                    value={event.hero_image ?? undefined}
                    onChange={(url) => update("hero_image", url || null)}
                    onFileChange={(f) => onImageFile?.(f)}
                    alt={event.title}
                    placeholder={
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm bg-muted">
                        Click to upload event image
                      </div>
                    }
                  />
                ) : event.hero_image ? (
                  <img
                    src={event.hero_image}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted">
                    <Calendar className="h-12 w-12" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two-column body: customizable content (left) + sticky sidebar (right) */}
        <div className={`grid grid-cols-1 ${status === "past" ? "" : "lg:grid-cols-[1fr_320px]"} gap-6 pb-2`}>
          <div id="event-body-left" className="min-w-0">
            {children}
          </div>
          {status !== "past" && (
          <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            {/* Registration / RSVP card */}
            {event.event_type !== "dropin" && (hasRegisterCta || event.cost_amount != null || event.cost_description || deadline) && (
              <div className="rounded-xl border bg-gradient-to-br from-primary/10 to-peach/40 shadow-sm p-5 border-l-4 border-l-primary space-y-3">
                <h3 className="text-sm font-bold text-primary-darker uppercase tracking-wide">
                  {event.event_type === "rsvp" ? "RSVP Details" : "Registration Details"}
                </h3>
                {deadline && (
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className="font-semibold text-primary-darker">{event.event_type === "rsvp" ? "RSVP Deadline:" : pc.deadlineLabel}</span>
                    <span>{deadline}</span>
                  </div>
                )}
                {hasRegisterCta && (event.capacity != null || goingCount > 0) && (
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <Users className="h-4 w-4 text-primary-darker" />
                    <span>
                      <span className="font-semibold text-primary-darker">{goingCount}</span>
                      {event.capacity != null ? (
                        <>
                          {" of "}
                          <span className="font-semibold text-primary-darker">{event.capacity}</span>
                          {" spots filled"}
                        </>
                      ) : (
                        ` ${event.event_type === "rsvp" ? "going" : "registered"}`
                      )}
                    </span>
                  </div>
                )}
                {(event.cost_amount != null || event.cost_description) && (
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className="font-semibold text-primary-darker">{pc.costLabel}</span>
                    <span className="text-accent font-semibold">
                      {event.cost_amount != null
                        ? event.cost_amount === 0
                          ? "Free"
                          : `$${event.cost_amount.toFixed(2).replace(/\.00$/, "")}`
                        : null}
                      {event.cost_amount != null && event.cost_description ? " " : ""}
                      {event.cost_description && (
                        <span className="text-foreground/70 font-normal">{event.cost_description}</span>
                      )}
                    </span>
                  </div>
                )}
                {hasRegisterCta && (
                  <>
                    <button
                      type="button"
                      onClick={onCtaClick}
                      disabled={isClosed && !editing}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent-lighter px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isClosed ? closedLabel : ctaLabel}
                    </button>
                    {event.payment_note && event.event_type === "registration" && (
                      <p className="text-xs text-foreground/70 whitespace-pre-wrap">{event.payment_note}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Organizer */}
            {hasOrganizer && (
              <div className="rounded-xl border bg-white shadow-sm p-5 border-l-4 border-l-accent">
                <h3 className="text-sm font-bold text-primary-darker uppercase tracking-wide mb-3">Contact</h3>
                <div className="space-y-2 text-sm text-foreground/85">
                  {event.organizer_name && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>{event.organizer_name}</span>
                    </div>
                  )}
                  {event.organizer_email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <a href={`mailto:${event.organizer_email}`} className="text-accent hover:underline break-all">
                        {event.organizer_email}
                      </a>
                    </div>
                  )}
                  {event.organizer_phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <a href={`tel:${event.organizer_phone}`} className="text-accent hover:underline">
                        {event.organizer_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            {hasDocuments && (
              <div className="rounded-xl border bg-white shadow-sm p-5 border-l-4 border-l-peach">
                <h3 className="text-sm font-bold text-primary-darker uppercase tracking-wide mb-3">Documents</h3>
                <DocumentsList files={event.documents} />
              </div>
            )}
          </aside>
          )}
        </div>
      </div>
    </article>
  );
}
