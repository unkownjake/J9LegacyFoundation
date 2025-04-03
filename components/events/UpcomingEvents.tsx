import { useState } from "react";
import EventCard from "./EventCard";
import EventModal from "./EventModal";
import { Event } from "./types";

interface UpcomingEventsProps {
  events: Event[];
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  return (
    <section className="mb-16">
      <h1 className="text-4xl font-bold mb-6 text-primary">Upcoming Events</h1>
      <p className="text-lg text-accent mb-16">
        Join us in our mission to empower youth and families. Check out our
        upcoming events and get involved!
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
