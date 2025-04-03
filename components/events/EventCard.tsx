import Image from "next/image";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Event } from "./types";

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
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
        <p className="text-gray-700 mb-6">{event.description}</p>
        <div className="flex justify-center">
          <button
            onClick={onClick}
            className="bg-primary text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 transition duration-300"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
