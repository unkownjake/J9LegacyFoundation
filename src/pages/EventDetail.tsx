import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import EventPageView from "@/components/site/EventPageView";
import EventSubmissionForm from "@/components/site/EventSubmissionForm";
import { ComponentView } from "@/components/site/SectionPageView";
import { normalizeRow } from "@/lib/types/cms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getEventBySlug } from "@/lib/events";
import { getPageContent } from "@/lib/cms";
import { getEventStatus, type EventRecord } from "@/lib/types/events";
import type { SectionPageContent } from "@/lib/types/cms";
import NotFound from "@/pages/NotFound";

export function eventSectionSlug(eventId: string, variant: "upcoming" | "past") {
  return `event:${eventId}:${variant}`;
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventRecord | null | undefined>(undefined);
  const [section, setSection] = useState<SectionPageContent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!slug) {
      setEvent(null);
      return;
    }
    getEventBySlug(slug)
      .then(async (e) => {
        if (!e || !e.published) {
          setEvent(null);
          return;
        }
        setEvent(e);
        const status = getEventStatus(e);
        const variant = status === "past" ? "past" : "upcoming";
        const content = await getPageContent<SectionPageContent>(
          eventSectionSlug(e.id, variant),
        );
        setSection(content && content.rows ? content : null);
      })
      .catch(() => setEvent(null));
  }, [slug]);

  if (event === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!event) return <NotFound />;
  return (
    <>
      <EventPageView event={event} onCtaClick={() => setOpen(true)}>
        {section && section.rows.length > 0 && (
          <div className="space-y-6">
            {section.rows.map((row) => {
              const r = normalizeRow(row);
              const colCls = r.columns === 3
                ? "grid-cols-1 md:grid-cols-3"
                : r.columns === 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : "grid-cols-1";
              return (
                <div key={r.id} className={`grid gap-6 ${colCls} items-stretch`}>
                  {r.cells.map((items, idx) =>
                    items.length === 0 ? (
                      <div key={idx} className="h-full" aria-hidden />
                    ) : (
                      <div key={idx} className="tile h-full flex flex-col">
                        {items.map((item, i) => {
                          const isLast = i === items.length - 1;
                          const growable =
                            item.kind === "image" || item.kind === "hero" ||
                            item.kind === "text" || item.kind === "list" ||
                            item.kind === "quote" || item.kind === "infoCard" ||
                            item.kind === "documents";
                          return (
                            <div key={item.id} className={growable && isLast ? "flex-1 min-h-0 flex flex-col" : ""}>
                              <ComponentView
                                component={item}
                                fillHeight={growable && isLast}
                                isFirst={i === 0}
                                isLast={isLast}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ),
                  )}
                </div>
              );
            })}
          </div>
        )}
      </EventPageView>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {event.event_type === "rsvp" ? "RSVP" : "Register"} — {event.title}
            </DialogTitle>
          </DialogHeader>
          <EventSubmissionForm event={event} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
