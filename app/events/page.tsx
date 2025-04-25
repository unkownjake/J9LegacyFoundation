"use client";
import UpcomingEvents from "@/components/events/UpcomingEvents";
import PastEvents from "@/components/events/PastEvents";
import eventData from "./eventData.json";
import { Event } from "@/components/events/types";

export default function EventsPage() {
  const upcomingEvents: Event[] = eventData; // Populates event cards with array
  // const upcomingEvents: Event[] = [
  //   {
  //     id: 1,
  //     title: "J9 Legacy Skate Fundraiser",
  //     date: "May 10, 2025",
  //     time: "4:00 PM - 7:00 PM",
  //     location: "Lynwood Bowl & Skate",
  //     address: "6210 200TH ST SW Lynwood, WA 98036",
  //     description: "Join us for a fun-filled evening of skating!",
  //     cardImageUrl: "/rollerskates.jpg",
  //     modalImageUrl: "/skate-flyer.png",
  //     additionalInfo:
  //       "All ages welcome. Ticket purchases will be made at the venue but please RSVP bellow for us to get a gauge for the number of attendees.",
  //     src: "https://forms.gle/KdRtoad9YsEibRNG6",
  //   },
  // ];

  // const pastEvents: Event[] = [
  //   {
  //     id: 1,
  //     title: "Memorial 3 by Lacrosse Jamboree",
  //     date: "November 30, 2024",
  //     time: "9AM - 3PM",
  //     location: "Kellogg Middle School",
  //     address: "16045 25th AVE NE, Shoreline, WA 98155",
  //     description:
  //       "3by lacrosse is fast paced, free flowing game which heavily emphasizes skill and quick decision making under pressure.It's a finesse and skill game, and not a strength and power game.",
  //     cardImageUrl: "/3by.JPG",
  //     modalImageUrl: "/3by.JPG",
  //     additionalInfo:
  //       "The foundation hosted a 3 by jamboree on Saturday November 30th, 2024, in honor of Jacob Eshenbaugh, who passed away on May 23, 2024.",
  //     src: "https://drive.google.com/drive/folders/1JUiGQdtvx7Wwz__n-b51-E1xtgSJRhhc?usp=sharing",
  //   },
  // ];

  return (
    <div className="bg-secondary">
      <div className="container mx-auto px-4 py-12">
        <UpcomingEvents events={upcomingEvents} />
        {/* <PastEvents events={pastEvents} /> */}
      </div>
    </div>
  );
}
