"use client";
import { useState } from "react";
import Header from "../../components/Header";
import { Collapsible } from "@radix-ui/react-collapsible";
import Footer from "../../components/Footer";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import Image from "next/image";

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  address?: string;
  description: string;
  imageUrl: string;
  additionalInfo: string;
  src: string;
}

export default function EventsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const event = {
    id: 1,
    title: "J9 Legacy Skate Fundraiser",
    date: "May 10, 2025",
    time: "TBD",
    location: "Lynwood Bowl & Skate",
    address: "6210 200TH ST SW Lynwood, WA 98036",
    description: "Join us for a fun-filled evening of skating!",
    imageUrl: "/rollerskates.jpg",
    additionalInfo:
      "All ages welcome. Ticket purchases will be made at the venue but please fill out the form bellow for us to get a gauge for the number of attendees.",
    src: "https://forms.gle/KdRtoad9YsEibRNG6",
  };

  const pastEvent = {
    id: 1,
    title: "Memorial 3 by Lacrosse Jamboree",
    date: "November 30, 2024",
    time: "9AM - 3PM",
    location: "Kellogg Middle School",
    address: "16045 25th AVE NE, Shoreline, WA 98155",
    description:
      "3by lacrosse is fast paced, free flowing game which heavily emphasizes skill and quick decision making under pressure.It's a finesse and skill game, and not a strength and power game.",
    imageUrl: "/3by.JPG",
    additionalInfo:
      "The foundation hosted a 3 by jamboree on Saturday November 30th, 2024, in honor of Jacob Eshenbaugh, who passed away on May 23, 2024.",
    src: "https://drive.google.com/drive/folders/1JUiGQdtvx7Wwz__n-b51-E1xtgSJRhhc?usp=sharing",
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <section className="mb-16">
          <h1 className="text-4xl font-bold mb-6 text-primary">
            Upcoming Events
          </h1>
          <p className="text-lg text-accent mb-16">
            Join us in our mission to empower youth and families. Check out our
            upcoming events and get involved!
          </p>
          <EventCard event={event} onClick={() => setIsModalOpen(true)} />
          {isModalOpen && (
            <Modal event={event} onClose={() => setIsModalOpen(false)} />
          )}
        </section>

        {/* <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6 text-orange-700">Past Events</h2>
        <p className="text-lg text-gray-700 mb-8">
          Take a look at some of our previous events and the impact we've made in our community.
        </p>
        <EventCard event={pastEvent} onClick={() => setIsModalOpen(true)} />
            {isModalOpen && <Modal event={pastEvent} onClose={() => setIsModalOpen(false)} />}
      </section> */}
      </main>
      <Footer />
    </div>
  );
}

function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  return (
    <div
      className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 max-w-2xl mx-auto cursor-pointer"
      onClick={onClick}
    >
      <Image
        src={event.imageUrl}
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
          <button className="bg-primary text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 transition duration-300">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ event, onClose }: { event: Event; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-semibold text-primary-darker">
              {event.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <Image
            src={event.imageUrl || "/placeholder.svg"}
            alt={event.title}
            width={800}
            height={400}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center text-accent">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center text-accent">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center text-accent col-span-full">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              <span>
                {event.location} - {event.address}
              </span>
            </div>
          </div>
          <p className="text-accent mb-4">{event.description}</p>
          <h3 className="text-xl font-semibold mb-2 text-primary-darker">
            Additional Information
          </h3>
          <p className="text-accent mb-6">{event.additionalInfo}</p>
          <div className="flex justify-center h-full">
            <iframe
              src={event.src}
              className="w-full h-screen border-none"
              title={event.title + "RSVP Form"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
