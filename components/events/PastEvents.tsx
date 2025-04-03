import { useState } from "react";
import EventCard from "./EventCard";
import EventModal from "./EventModal";
import { Event } from "./types";

interface PastEventsProps {
  events: Event[];
}

export default function PastEvents({ events }: PastEventsProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  if (events.length === 0) {
    return null;
  }
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-6 text-orange-700">Past Events</h2>
      <p className="text-lg text-gray-700 mb-8">
        Take a look at some of our previous events and the impact we've made in
        our community.
      </p>
      {events.map((event) => (
        <div key={event.id} className="mb-8">
          <EventCard event={event} onClick={() => setSelectedEvent(event)} />
        </div>
      ))}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </section>
  );
}
