import { Calendar, Clock, MapPin } from "lucide-react";
import type { EventRecord } from "@/lib/types/events";

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

interface EventCardProps {
  event: EventRecord;
  ctaLabel?: string;
  ctaLink?: string | null;
}

export default function EventCard({ event, ctaLabel = "View Details", ctaLink }: EventCardProps) {
  const date = fmtDate(event.starts_at);
  const time = fmtTimeRange(event.starts_at, event.ends_at);
  const link = ctaLink ?? `/events/${event.slug}`;
  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col">
      {event.hero_image && (
        <div className="aspect-[4/3] bg-muted overflow-hidden">
          <img
            src={event.hero_image}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col gap-2">
        <h3 className="text-lg font-bold text-primary-darker">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-foreground/80 line-clamp-4">{event.description}</p>
        )}
        {date && (
          <p className="text-sm text-foreground/70 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" /> {date}
          </p>
        )}
        {time && (
          <p className="text-sm text-foreground/70 flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" /> {time}
          </p>
        )}
        {event.location && (
          <p className="text-sm text-foreground/70 flex items-start gap-2">
            <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span>{event.location.replace(/\s*\n\s*/g, ", ")}</span>
          </p>
        )}
        <div className="pt-3 mt-auto">
          <a
            href={link}
            className="block text-center bg-accent text-accent-foreground hover:bg-accent-lighter px-4 py-2.5 rounded-lg font-semibold transition"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
