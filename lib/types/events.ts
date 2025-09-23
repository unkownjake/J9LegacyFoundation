export type RegistrationType = "required" | "rsvp" | "dropin";

// Data types for form fields
export type FormFieldType =
  | "string" // Short answer text
  | "number" // Number input
  | "email" // Email input with validation
  | "phone" // Phone number input
  | "date" // Date picker
  | "boolean" // Yes/No checkbox
  | "select" // Dropdown with options
  | "textarea" // Paragraph text
  | "file" // File upload
  | "radio" // Radio buttons (single choice)
  | "checkboxes"; // Select all that apply (multiple choice)

// Form field definition
export interface FormField {
  type: FormFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[]; // For select, radio, checkbox fields
    allowWriteIn?: boolean; // For radio and checkbox fields
  };
}

// Participant form schema (for events with multiple participants)
export interface ParticipantFormSchema {
  fields: Record<string, FormField>;
  maxParticipants?: number;
  minParticipants?: number;
  allowMultiple?: boolean; // Can one registration include multiple participants?
}

// Registration form schema
export interface RegistrationFormSchema {
  // All form fields (name, email, phone, waivers, preferences, etc.)
  fields: Record<string, FormField>;

  // Participant-specific fields (if this is a multi-participant event)
  participantSchema?: ParticipantFormSchema;
}

export interface EventRegistration {
  type: RegistrationType;
  deadline?: number; // epoch timestamp
  maxCapacity?: number;
  currentCapacity?: number; // Computed from registrations, not stored in DB
  cost?: number;

  // Form schema for registration (only needed for required/rsvp events)
  formSchema?: RegistrationFormSchema;
}

// Registration data types
export type FormFieldValue = string | number | boolean | Date | File | string[];

// Single participant registration data
export interface ParticipantRegistration {
  [fieldName: string]: FormFieldValue;
}

export interface EventLocation {
  name: string;
  address?: string;
  city: string;
  state: string;
  zipCode?: string;
  isVirtual?: boolean;
  virtualLink?: string;
}

export interface EventSchedule {
  startTime: number; // epoch timestamp for start time
  endTime: number; // epoch timestamp for end time
}

export interface EventResource {
  id: string;
  name: string;
  // Storage path for the resource in Firebase Storage
  path: string;
  type: "document" | "image" | "video" | "other";
  uploadedAt: number;
}

export interface EventMedia {
  // Storage path for the main event image in Firebase Storage
  imagePath?: string;
  // Public URL for the main event image (generated from imagePath)
  imageUrl?: string;
  // Public URL for the event flyer (generated from resources)
  flyerUrl?: string;
  videoUrl?: string; // Promotional video
  googlePhotosAlbumUrl?: string; // Link to Google Photos album (for completed events)
  resources?: EventResource[]; // Multiple named resources/documents (paths)
}

export interface EventContact {
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;

  // Timing & Location
  schedule: EventSchedule;
  location: EventLocation;

  // Registration & Capacity
  registration: EventRegistration;

  // Content & Media
  content: {
    highlights?: string[];
    whatToBring?: string[];
    ageRange?: string;
    skillLevel?: string;
    activities?: string[];
  };

  // Media & Visuals
  media: EventMedia;

  // Contact Information
  contact: EventContact;

  // Response summary (updated when responses are added/removed)
  responseSummary?: EventResponseSummary;

  // Post-Event Content (for completed events)
  postEventContent?: {
    thankYouMessage?: string;
    sponsorThankYou?: string;
    eventHighlights?: string[];
    participantCount?: number;
    fundsRaised?: number;
  };

  // Metadata
  tags: string[];
  createdAt: number; // epoch timestamp
  updatedAt: number; // epoch timestamp
  createdBy: string;
  updatedBy: string;

  // SEO & Display
  slug: string;
  metaDescription?: string;
  featuredImage?: string;
  isFeatured?: boolean;

  // Internal Management
  isActive: boolean;
}

// Simplified event for display purposes
export interface EventDisplay {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  schedule: EventSchedule;
  location: EventLocation;
  registration: EventRegistration;
  content: {
    highlights?: string[];
    whatToBring?: string[];
    ageRange?: string;
    skillLevel?: string;
    activities?: string[];
  };
  media: EventMedia;
  contact: EventContact;
  tags: string[];
  slug: string;

  // Display properties
  isFeatured?: boolean;

  // Response summary (updated when responses are added/removed)
  responseSummary?: EventResponseSummary;

  // Post-Event Content (for completed events)
  postEventContent?: {
    thankYouMessage?: string;
    sponsorThankYou?: string;
    eventHighlights?: string[];
    participantCount?: number;
    fundsRaised?: number;
  };
}

// Event creation/update payload
export interface EventPayload {
  title: string;
  description: string;
  shortDescription?: string;
  schedule: EventSchedule;
  location: EventLocation;
  registration: EventRegistration;
  content?: {
    highlights?: string[];
    whatToBring?: string[];
    ageRange?: string;
    skillLevel?: string;
    activities?: string[];
  };
  media: EventMedia;
  contact: EventContact;
  tags: string[];
  slug: string;
  metaDescription?: string;
  featuredImage?: string;
  isActive?: boolean;

  // Response summary (updated when responses are added/removed)
  responseSummary?: EventResponseSummary;

  // Post-Event Content (for completed events)
  postEventContent?: {
    thankYouMessage?: string;
    sponsorThankYou?: string;
    eventHighlights?: string[];
    participantCount?: number;
    fundsRaised?: number;
    nextEventInfo?: string;
  };
}

// Utility function to calculate event status from timestamps
export function getEventStatus(
  schedule: EventSchedule
): "upcoming" | "ongoing" | "completed" {
  const now = Date.now();
  const eventStart = schedule.startTime;
  const eventEnd = schedule.endTime;

  if (now < eventStart) {
    return "upcoming";
  } else if (now >= eventStart && now <= eventEnd) {
    return "ongoing";
  } else {
    return "completed";
  }
}

// Utility function to check if event is in the future
export function isEventUpcoming(schedule: EventSchedule): boolean {
  return Date.now() < schedule.startTime;
}

// Utility function to check if event is today
export function isEventToday(schedule: EventSchedule): boolean {
  const today = new Date();
  const eventDate = new Date(schedule.startTime); // Use startTime for date

  return (
    today.getFullYear() === eventDate.getFullYear() &&
    today.getMonth() === eventDate.getMonth() &&
    today.getDate() === eventDate.getDate()
  );
}

// Utility function to check if event is all-day
export function isEventAllDay(schedule: EventSchedule): boolean {
  const startDate = new Date(schedule.startTime);
  const endDate = new Date(schedule.endTime);

  // Check if start time is midnight (00:00:00) and end time is next midnight (00:00:00)
  const startHour = startDate.getHours();
  const startMinute = startDate.getMinutes();
  const startSecond = startDate.getSeconds();
  const endHour = endDate.getHours();
  const endMinute = endDate.getMinutes();
  const endSecond = endDate.getSeconds();

  return (
    startHour === 0 &&
    startMinute === 0 &&
    startSecond === 0 &&
    endHour === 0 &&
    endMinute === 0 &&
    endSecond === 0
  );
}

// Utility function to get event date (for display purposes)
export function getEventDate(schedule: EventSchedule): Date {
  return new Date(schedule.startTime);
}

// Event response/registration data structure
export interface EventResponse {
  id: string;
  type: "rsvp" | "registration";
  time: number; // epoch timestamp when response was submitted
  email: string; // Primary contact email for this response
  fields: Record<string, FormFieldValue>; // All form field data (contact info, preferences, etc.)
  participants: Record<string, FormFieldValue>[]; // Individual participant data (empty array if no participant schema)
  registrationVerified?: boolean; // Admin verification of payment for registration events
  metadata?: Record<string, any>; // Flexible metadata for tracking additional information (payment links, analytics, etc.)
}

// Event response summary for display
export interface EventResponseSummary {
  totalResponses: number;
  totalParticipants: number;
}

// Events page data structure
export interface EventsPageData {
  upcomingEvents: EventDisplay[];
  pastEvents: EventDisplay[];
}

// Utility function to check if event is ongoing
export function isEventOngoing(schedule: EventSchedule): boolean {
  const now = Date.now();
  return now >= schedule.startTime && now <= schedule.endTime;
}

// Utility function to check if event is in the past
export function isEventPast(schedule: EventSchedule): boolean {
  return Date.now() > schedule.endTime;
}

// Utility function to check if event is in the future
export function isEventFuture(schedule: EventSchedule): boolean {
  return Date.now() < schedule.startTime;
}

// Utility function to validate event response data
export function validateEventResponse(
  data: Partial<EventResponse>,
  eventSchema?: RegistrationFormSchema
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required fields
  if (!data.email || typeof data.email !== "string" || !data.email.trim()) {
    errors.push("Email is required");
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    errors.push("Please enter a valid email address");
  }

  if (!data.type || !["rsvp", "registration"].includes(data.type)) {
    errors.push("Response type is required");
  }

  // Validate participants
  if (!data.participants || !Array.isArray(data.participants)) {
    errors.push("Participants array is required");
  } else if (data.participants.length === 0) {
    errors.push("At least one participant is required");
  }

  // If no schema provided, just validate basic required fields
  if (!eventSchema) {
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate form fields
  if (eventSchema.fields) {
    for (const [fieldName, field] of Object.entries(eventSchema.fields)) {
      if (field.required && !data.fields?.[fieldName]) {
        errors.push(`${field.label} is required`);
      }
    }
  }

  // Validate participants if this is a multi-participant event
  if (eventSchema.participantSchema && data.participants) {
    const participantSchema = eventSchema.participantSchema;

    // Check participant count limits
    if (
      participantSchema.maxParticipants &&
      data.participants.length > participantSchema.maxParticipants
    ) {
      errors.push(
        `Maximum ${participantSchema.maxParticipants} participants allowed`
      );
    }

    if (
      participantSchema.minParticipants &&
      data.participants.length < participantSchema.minParticipants
    ) {
      errors.push(
        `Minimum ${participantSchema.minParticipants} participants required`
      );
    }

    // Validate each participant's data if schema has fields
    if (
      participantSchema.fields &&
      Object.keys(participantSchema.fields).length > 0
    ) {
      data.participants.forEach((participant, index) => {
        Object.entries(participantSchema.fields).forEach(
          ([fieldName, field]) => {
            if (field.required && !participant[fieldName]) {
              errors.push(
                `Participant ${index + 1}: ${field.label} is required`
              );
            }
          }
        );
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Utility function to calculate response summary from responses
export function calculateResponseSummary(
  responses: EventResponse[]
): EventResponseSummary {
  return {
    totalResponses: responses.length,
    totalParticipants: responses.reduce(
      (sum, r) => sum + (r.participants?.length || 0), // Use actual participants array length (0 if no participants)
      0
    ),
  };
}
