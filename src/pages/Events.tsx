import { useEffect, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { getPageContent } from "@/lib/cms";
import { listPublishedEvents } from "@/lib/events";
import {
  emptyEventsPageContent,
  getEventStatus,
  type EventRecord,
  type EventsPageContent,
} from "@/lib/types/events";
import EventCard from "@/components/site/EventCard";

export default function EventsPage() {
  const [content, setContent] = useState<EventsPageContent | null>(null);
  const [events, setEvents] = useState<EventRecord[] | null>(null);

  useEffect(() => {
    getPageContent<EventsPageContent>("events").then((c) =>
      setContent({ ...emptyEventsPageContent, ...(c ?? {}) }),
    );
    listPublishedEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  if (!content || !events) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const now = new Date();
  const inProgress = events.filter((e) => getEventStatus(e, now) === "in-progress");
  const upcoming = events.filter((e) => getEventStatus(e, now) === "upcoming");
  const past = events.filter((e) => getEventStatus(e, now) === "past");

  return (
    <article className="bg-[hsl(0_0%_98%)] min-h-[60vh]">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-4 leading-tight flex items-center gap-3">
          <Calendar className="h-9 w-9" /> {content.title}
        </h1>
        {content.intro && (
          <p className="text-base lg:text-lg text-foreground/85 leading-relaxed mb-8 max-w-3xl">
            {content.intro}
          </p>
        )}

        {inProgress.length > 0 ? (
          <InProgressSection content={content} event={inProgress[0]} />
        ) : events.length === 0 ? (
          <EmptySection content={content} />
        ) : (
          <>
            {upcoming.length > 0 && (
              <Section heading={content.upcomingHeading} events={upcoming} />
            )}
            {past.length > 0 && <Section heading={content.pastHeading} events={past} />}
          </>
        )}
      </div>
    </article>
  );
}

function Section({ heading, events }: { heading: string; events: EventRecord[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold text-primary-darker mb-4">{heading}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
}

function InProgressSection({
  content,
  event,
}: {
  content: EventsPageContent;
  event: EventRecord;
}) {
  return (
    <section className="mt-6 bg-accent/10 border-2 border-accent rounded-xl p-6 md:p-8">
      <span className="inline-block bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-3">
        {content.inProgress.badge}
      </span>
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
        {content.inProgress.title}
      </h2>
      <p className="text-foreground/85 mb-6">{content.inProgress.intro}</p>
      <div className="max-w-md">
        <EventCard event={event} />
      </div>
    </section>
  );
}

function EmptySection({ content }: { content: EventsPageContent }) {
  return (
    <section className="mt-6 bg-white border rounded-xl p-10 text-center">
      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
      <h2 className="text-2xl font-bold text-primary-darker mb-2">{content.empty.title}</h2>
      <p className="text-foreground/80">{content.empty.intro}</p>
    </section>
  );
}
