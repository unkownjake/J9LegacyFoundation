"use client";
import { useState } from "react"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import { Calendar, Clock, MapPin, X } from "lucide-react"
import Image from "next/image"

export default function EventsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const event = {
    id: 1,
    title: "J9 Legacy Skate Fundraiser",
    date: "May 10, 2025",
    time: "TBD",
    location: "Lynwood Bowl & Skate",
    address: "6210 200TH ST SW Lynwood, WA 98036",
    description:
      "Join us for a fun-filled evening of skating!",
    imageUrl: "/placeholder.svg?height=300&width=500", // Replace with actual image URL
    additionalInfo:
      "All ages welcome. Ticket price includes skate rental. Snacks and drinks will be available for purchase. Don't forget to bring socks!",
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-orange-700">Upcoming Events</h1>
        <p className="text-lg text-gray-700 mb-8">
          Join us in our mission to empower youth and families. Check out our upcoming events and get involved!
        </p>
        <EventCard event={event} onClick={() => setIsModalOpen(true)} />
        {isModalOpen && <Modal event={event} onClose={() => setIsModalOpen(false)} />}
      </main>
      <Footer />
    </div>
  )
}

function EventCard({ event, onClick }) {
  return (
    <div
      className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 max-w-2xl mx-auto cursor-pointer"
      onClick={onClick}
    >
      <Image
        src={event.imageUrl || "/placeholder.svg"}
        alt={event.title}
        width={500}
        height={300}
        className="w-full h-64 object-cover"
      />
      <div className="p-6">
        <h2 className="text-3xl font-semibold mb-4 text-orange-600">{event.title}</h2>
        <div className="flex items-center text-gray-600 mb-2">
          <Calendar className="h-5 w-5 mr-2 text-orange-500" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center text-gray-600 mb-2">
          <Clock className="h-5 w-5 mr-2 text-orange-500" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="h-5 w-5 mr-2 text-orange-500" />
          <span>{event.location}</span>
        </div>
        <p className="text-gray-700 mb-6">{event.description}</p>
        <div className="flex justify-center">
          <button className="bg-orange-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 transition duration-300">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}

function Modal({ event, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-semibold text-orange-600">{event.title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2 text-orange-500" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="h-5 w-5 mr-2 text-orange-500" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center text-gray-600 col-span-full">
              <MapPin className="h-5 w-5 mr-2 text-orange-500" />
              <span>
                {event.location} - {event.address}
              </span>
            </div>
          </div>
          <p className="text-gray-700 mb-4">{event.description}</p>
          <h3 className="text-xl font-semibold mb-2 text-orange-600">Additional Information</h3>
          <p className="text-gray-700 mb-6">{event.additionalInfo}</p>
          <div className="flex justify-center">
            <button className="bg-orange-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 transition duration-300">
              Register Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}