import { useState } from "react";
import EventCard from "./EventCard";
import EventModal from "./EventModal";
import { Event } from "./types";
import Link from "next/link";

interface UpcomingEventsProps {
  events: Event[];
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  if (events.length === 0) {
    return (
      <section className="mb-16">
        <h1 className="text-4xl font-bold mb-6 text-primary">
          Upcoming Events
        </h1>
        <div className="bg-primary-lighter p-8 rounded-lg text-center">
          <p className="text-lg text-accent mb-4">
            No upcoming events scheduled at this time.
          </p>
          <p className="text-accent">
            Stay connected with us on social media to be the first to know about
            new events!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <h1 className="text-4xl font-bold mb-6 text-primary">Upcoming Events</h1>
      <p className="text-lg text-accent mb-8">
        Join us in our mission to empower youth and families. Check out our
        upcoming events and get involved!
      </p>

      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-8">
        <p className="text-accent mb-2">
          <strong>Event Types:</strong>
        </p>
        <ul className="text-accent space-y-1">
          <li>
            • <strong>Registration Required:</strong> Events that require
            advance registration and payment
          </li>
          <li>
            • <strong>RSVP Requested:</strong> Free events where we'd like a
            headcount for planning purposes
          </li>
          <li>
            • <strong>Drop-in Welcome:</strong> Open events where you can simply
            show up
          </li>
        </ul>
      </div>

      <div className="flex gap-8 justify-center flex-wrap">
        {events.map((event) => (
          <div key={event.id} className="mb-8">
            <EventCard event={event} onClick={() => setSelectedEvent(event)} />
          </div>
        ))}
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </section>
  );
}
