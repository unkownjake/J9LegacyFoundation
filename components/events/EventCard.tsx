import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin, Camera, ExternalLink } from "lucide-react";
import { Event } from "./types";

interface EventCardProps {
  event: Event;
  onClick: () => void;
  onPhotoUpload?: () => void;
}

export default function EventCard({
  event,
  onClick,
  onPhotoUpload,
}: EventCardProps) {
  const getActionButton = () => {
    if (event.isPastEvent) {
      return (
        <div className="flex gap-2">
          {event.photoAlbumUrl && (
            <Link
              href={event.photoAlbumUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center border-primary border text-primary px-4 py-2 rounded-lg font-semibold hover:bg-orange-100 transition duration-300"
            >
              <Camera className="h-4 w-4 mr-2" />
              View Photos
            </Link>
          )}
          {onPhotoUpload && (
            <button
              onClick={onPhotoUpload}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-darker transition duration-300"
            >
              Submit Photos
            </button>
          )}
        </div>
      );
    }

    // For upcoming events
    switch (event.actionType) {
      case "registration":
        return (
          <div className="flex gap-2">
            <Link
              href={`/events/${event.slug}`}
              className="flex-1 border-primary border text-primary px-4 py-2 rounded-lg font-semibold hover:bg-orange-100 transition duration-300 text-center"
            >
              Learn More
            </Link>
            <Link
              href={event.src}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-darker transition duration-300 text-center"
            >
              Register Now
            </Link>
          </div>
        );

      case "rsvp":
        return (
          <div className="flex gap-2">
            <Link
              href={`/events/${event.slug}`}
              className="flex-1 border-primary border text-primary px-4 py-2 rounded-lg font-semibold hover:bg-orange-100 transition duration-300 text-center"
            >
              Learn More
            </Link>
            <button
              onClick={onClick}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-darker transition duration-300"
            >
              RSVP
            </button>
          </div>
        );

      case "none":
        return (
          <Link
            href={`/events/${event.slug}`}
            className="w-full block text-center border-primary border text-primary px-6 py-2 rounded-lg font-semibold hover:bg-orange-100 transition duration-300"
          >
            Learn More
          </Link>
        );

      default:
        // Fallback to original behavior
        return (
          <div className="flex gap-2">
            <Link
              href={`/events/${event.slug}`}
              className="flex-1 border-primary border text-primary px-4 py-2 rounded-lg font-semibold hover:bg-orange-100 transition duration-300 text-center"
            >
              Learn More
            </Link>
            <button
              onClick={onClick}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-darker transition duration-300"
            >
              RSVP
            </button>
          </div>
        );
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 max-w-2xl mx-auto">
      <Image
        src={event.cardImageUrl}
        alt={event.title}
        width={500}
        height={300}
        className="w-full h-64 object-cover"
      />
      <div className="p-6">
        <h2 className="text-3xl font-semibold mb-4 text-primary-darker">
          {event.title}
        </h2>
        <div className="flex items-center text-accent mb-2">
          <Calendar className="h-5 w-5 mr-2 text-primary" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center text-accent mb-2">
          <Clock className="h-5 w-5 mr-2 text-primary" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center text-accent mb-4">
          <MapPin className="h-5 w-5 mr-2 text-primary" />
          <span>{event.location}</span>
        </div>
        <p className="text-accent mb-6">{event.description}</p>

        {event.isPastEvent && event.thankYouMessage && (
          <div className="bg-primary-lighter p-4 rounded-lg mb-4">
            <p className="text-accent font-medium">{event.thankYouMessage}</p>
          </div>
        )}

        <div className="flex justify-center">{getActionButton()}</div>
      </div>
    </div>
  );
}
