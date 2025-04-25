"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Event } from "@/components/events/types";
import EventModal from "@/components/events/EventModal";
import eventData from "../eventData.json";
import Image from "next/image";
import { Calendar, Clock, MapPin, ChevronLeft } from "lucide-react";

interface EventPageProps {
  params: { slug: string };
}

export default function EventDetailPage({ params }: EventPageProps) {
  const event = (eventData as Event[]).find((e) => e.slug === params.slug); // Populates page content with array
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  if (!event) {
    return notFound(); // 404 page
  }

  return (
    <div className="container mx-auto px-4 py-12 mb-12">
      <Link
        href={`/events`}
        className="flex items-center gap-2 mb-6 text-primary text-sm hover:text-primary-darker transition duration-300"
      >
        <ChevronLeft className="h-5 w-5" />
        Back to Events
      </Link>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex flex-col lg:w-1/2">
          <h1 className="text-4xl font-bold mb-12 text-primary">
            {event.title}
          </h1>
          {/* Image for small/mobile screens */}
          <div className="lg:hidden flex w-full lg:w-1/2 mx-auto rounded-md overflow-hidden items-start mb-4">
            <Image
              src={event.modalImageUrl}
              alt={event.title}
              width={800}
              height={400}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col gap-3 mb-8">
            <div className="flex items-center text-accent">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center text-accent">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center text-accent">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              <span>
                {event.location} - {event.address}
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-4 text-primary-darker">
            Event Information
          </h2>

          <p className="text-accent mb-4">{event.description}</p>

          <p className="text-accent">{event.additionalInfo}</p>
          {/* Buttons for small screens */}
          <div className="lg:hidden flex flex-col mt-8 gap-8">
            <button
              onClick={() => setSelectedEvent(event)}
              className="bg-primary text-white px-16 py-2 rounded-lg font-semibold hover:bg-primary-darker transition duration-300"
            >
              RSVP
            </button>
            <Link
              href={`/events`}
              className="flex items-center gap-2 text-primary hover:text-primary-darker transition duration-300"
            >
              <ChevronLeft className="h-5 w-5" />
              Back to Events
            </Link>
          </div>
          {/* Buttons for large screens */}
          <div className="hidden lg:flex flex-col mt-8 gap-8 items-start">
            <button
              onClick={() => setSelectedEvent(event)}
              className="bg-primary text-white px-16 py-2 rounded-lg font-semibold hover:bg-primary-darker transition duration-300"
            >
              RSVP
            </button>
          </div>
        </div>

        {/* Image for large screens */}
        <div className="hidden lg:flex w-full lg:w-1/2 mx-auto rounded-md overflow-hidden items-start">
          <Image
            src={event.modalImageUrl}
            alt={event.title}
            width={800}
            height={400}
            className="object-contain"
          />
        </div>
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
