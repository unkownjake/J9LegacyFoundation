import { useState } from "react";
import EventCard from "./EventCard";
import EventModal from "./EventModal";
import PhotoUpload from "./PhotoUpload";
import { Event } from "./types";

interface PastEventsProps {
  events: Event[];
}

export default function PastEvents({ events }: PastEventsProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [photoUploadEvent, setPhotoUploadEvent] = useState<Event | null>(null);

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">
      <h2 className="text-4xl font-bold mb-6 text-primary">Past Events</h2>
      <div className="bg-primary-lighter p-6 rounded-lg mb-8">
        <p className="text-lg text-accent text-center font-medium">
          Thank you to everyone who attended our past events! Your participation
          and support help us continue our mission to empower youth and families
          in our community.
        </p>
      </div>

      <div className="flex gap-8 justify-center flex-wrap">
        {events.map((event) => (
          <div key={event.id} className="mb-8">
            <EventCard
              event={event}
              onClick={() => setSelectedEvent(event)}
              onPhotoUpload={() => setPhotoUploadEvent(event)}
            />
          </div>
        ))}
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {photoUploadEvent && (
        <PhotoUpload
          eventTitle={photoUploadEvent.title}
          eventId={photoUploadEvent.id}
          onClose={() => setPhotoUploadEvent(null)}
        />
      )}
    </section>
  );
}
