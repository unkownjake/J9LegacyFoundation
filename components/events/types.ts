export interface Event {
  id: number;
  slug: string;
  title: string;
  date: string;
  time: string;
  location: string;
  address?: string;
  description: string;
  cardImageUrl: string;
  modalImageUrl: string;
  additionalInfo: string;
  src: string;
  // New fields for enhanced event management
  actionType?: "registration" | "rsvp" | "none"; // For upcoming events
  isPastEvent?: boolean;
  photoAlbumUrl?: string; // For past events - link to view photos
  thankYouMessage?: string; // Custom thank you message for past events
}
