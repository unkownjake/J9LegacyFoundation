import Image from "next/image";
import { Calendar, Clock, MapPin, X, ChevronLeft } from "lucide-react";
import { Event } from "./types";
import { useState } from "react";

interface EventModalProps {
  event: Event;
  onClose: () => void;
}

export default function EventModal({ event, onClose }: EventModalProps) {
  const [showForm, setShowForm] = useState(false);
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-semibold text-primary-darker">
                {showForm ? `RSVP for ${event.title}` : event.title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {!showForm && (
            <Image
              src={event.modalImageUrl}
              alt={event.title}
              width={800}
              height={400}
              className="w-full object-contain rounded-lg mb-4"
            />
          )}
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
          {!showForm && (
            <>
              <p className="text-accent mb-4">{event.description}</p>
              <h3 className="text-xl font-semibold mb-2 text-primary-darker">
                Additional Information
              </h3>
              <p className="text-accent mb-6">{event.additionalInfo}</p>
            </>
          )}
          <div className="flex justify-center h-full">
            {showForm ? (
              <div className="w-full">
                <div className="flex items-center mb-4">
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-primary hover:text-orange-600 transition duration-300 flex items-center gap-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Back to Event Details
                  </button>
                </div>
                <iframe
                  src={event.src}
                  className="w-full h-[600px] md:h-[800px] border-none"
                  title={event.title + "RSVP Form"}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-600 transition duration-300"
              >
                RSVP Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
