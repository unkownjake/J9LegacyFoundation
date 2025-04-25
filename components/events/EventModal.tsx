import Image from "next/image";
import { Calendar, Clock, MapPin, X, ChevronLeft } from "lucide-react";
import { Event } from "./types";
import { useState } from "react";

interface EventModalProps {
  event: Event;
  onClose: () => void;
}

export default function EventModal({ event, onClose }: EventModalProps) {
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
          <div className="flex justify-center h-full">
            <div className="w-full">
              <iframe
                src={event.src}
                className="w-full h-[600px] md:h-[800px] border-none"
                title={event.title + "RSVP Form"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
