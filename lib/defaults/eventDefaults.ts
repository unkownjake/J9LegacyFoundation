import { Event } from "@/lib/types/events";

// Helper function to get epoch timestamps
const getTimestamp = (
  daysFromNow: number,
  hour: number = 12,
  minute: number = 0
) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
};

export const defaultEvents: Event[] = [
  // Past Event (2 weeks ago)
  {
    id: "lacrosse-jamboree-2024",
    title: "Unknown Jake Lacrosse Jamboree 2024",
    description:
      "Our annual lacrosse event honoring Jacob's memory and passion for the sport. This jamboree brings together young athletes for skill development and friendly competition.",
    shortDescription:
      "Annual lacrosse event for youth athletes with skill development and friendly competition.",
    isFeatured: true,
    schedule: {
      startTime: getTimestamp(-14, 9, 0), // 2 weeks ago at 9 AM
      endTime: getTimestamp(-14, 17, 0), // 2 weeks ago at 5 PM
    },
    location: {
      name: "Seattle Sports Complex",
      address: "1234 Sports Way",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
    },
    registration: {
      type: "required",
      deadline: getTimestamp(-21, 23, 59), // 1 week before event
      maxCapacity: 50,
      currentCapacity: 45,
      cost: 75,
      formSchema: {
        fields: {
          parentName: {
            type: "string",
            label: "Parent/Guardian Name",
            required: true,
          },
          parentEmail: { type: "email", label: "Parent Email", required: true },
          parentPhone: { type: "phone", label: "Parent Phone", required: true },
        },
        participantSchema: {
          fields: {
            name: { type: "string", label: "Participant Name", required: true },
            age: {
              type: "number",
              label: "Age",
              required: true,
              validation: { min: 8, max: 18 },
            },
            experience: {
              type: "select",
              label: "Experience Level",
              required: true,
              validation: { options: ["Beginner", "Intermediate", "Advanced"] },
            },
          },
          maxParticipants: 3,
          allowMultiple: true,
        },
      },
    },
    content: {
      highlights: [
        "Skills development",
        "Team building",
        "Friendly competition",
      ],
      whatToBring: ["Lacrosse stick", "Cleats", "Water bottle", "Lunch"],
      ageRange: "8-18 years",
      skillLevel: "All levels welcome",
      activities: ["Skills clinics", "Scrimmages", "Team challenges"],
    },
    media: {
      imagePath: "/lacrosse-event.jpg",
      imageUrl: "/lacrosse-event.jpg",
      flyerUrl: "/lacrosse-flyer.pdf",
    },
    contact: {
      organizerName: "J9 Legacy Foundation",
      organizerEmail: "info@j9legacy.org",
      organizerPhone: "(206) 555-0123",
    },
    tags: ["lacrosse", "annual", "sports", "youth"],
    createdAt: getTimestamp(-30),
    updatedAt: getTimestamp(-14),
    createdBy: "system",
    updatedBy: "system",
    slug: "lacrosse-jamboree-2024",
    metaDescription: "Annual lacrosse jamboree for youth athletes in Seattle",
    featuredImage: "/lacrosse-event.jpg",
    isActive: true,
    postEventContent: {
      thankYouMessage:
        "Thank you to all the amazing young athletes who participated in our first annual lacrosse jamboree!",
      sponsorThankYou:
        "Special thanks to our sponsors: Seattle Sports Foundation, Youth Athletics Fund, and local businesses.",
      eventHighlights: [
        "Over 45 youth athletes participated in the event",
        "Raised $3,375 for future camp sponsorships",
        "Featured guest appearance by local lacrosse legend Mike Johnson",
        "Perfect weather for outdoor activities and games",
        "New friendships formed between participants from different schools",
      ],
      participantCount: 45,
      fundsRaised: 3375,
    },
  },

  // Event in a month
  {
    id: "summer-camp-registration",
    title: "Summer Camp Registration Kickoff",
    description:
      "Join us for an exciting day of camp activities and registration for our summer programs. Meet counselors, try activities, and secure your spot for summer fun!",
    shortDescription:
      "Summer camp registration event with activities and counselor meet-and-greet.",
    isFeatured: false,
    schedule: {
      startTime: getTimestamp(30, 10, 0), // 1 month from now at 10 AM
      endTime: getTimestamp(30, 16, 0), // 1 month from now at 4 PM
    },
    location: {
      name: "Community Recreation Center",
      address: "5678 Recreation Ave",
      city: "Seattle",
      state: "WA",
      zipCode: "98102",
    },
    registration: {
      type: "rsvp",
      deadline: getTimestamp(25, 23, 59), // 5 days before event
      maxCapacity: 100,
      currentCapacity: 0,
      formSchema: {
        fields: {
          name: { type: "string", label: "Your Name", required: true },
          email: { type: "email", label: "Email", required: true },
          phone: { type: "phone", label: "Phone", required: false },
          familySize: {
            type: "number",
            label: "Number of family members attending",
            required: true,
            validation: { min: 1, max: 6 },
          },
        },
      },
    },
    content: {
      highlights: [
        "Camp preview",
        "Counselor meet-and-greet",
        "Registration assistance",
      ],
      whatToBring: ["Comfortable clothes", "Questions about summer camps"],
      ageRange: "All ages welcome",
      skillLevel: "N/A",
      activities: [
        "Camp activities preview",
        "Registration assistance",
        "Counselor Q&A",
      ],
    },
    media: {
      imagePath: "/summer-camp.jpg",
      imageUrl: "/summer-camp.jpg",
      flyerUrl: "/summer-camp-flyer.pdf",
    },
    contact: {
      organizerName: "J9 Legacy Foundation",
      organizerEmail: "info@j9legacy.org",
      organizerPhone: "(206) 555-0123",
    },
    tags: ["summer camp", "registration", "family", "free"],
    createdAt: getTimestamp(-7),
    updatedAt: getTimestamp(-7),
    createdBy: "system",
    updatedBy: "system",
    slug: "summer-camp-registration",
    metaDescription: "Summer camp registration kickoff event in Seattle",
    featuredImage: "/summer-camp.jpg",
    isActive: true,
  },

  // Ongoing event (right now)
  {
    id: "roller-skating-fundraiser",
    title: "Rollin' with Jacob Skate Fundraiser",
    description:
      "A fun-filled skating event that combines recreation with fundraising, creating lasting memories while supporting our cause. Join us for an afternoon of skating, music, and community!",
    shortDescription:
      "Fun roller skating fundraiser with music and community activities.",
    isFeatured: true,
    schedule: {
      startTime: getTimestamp(0, 14, 0), // Today at 2 PM
      endTime: getTimestamp(0, 18, 0), // Today at 6 PM
    },
    location: {
      name: "Skate World",
      address: "9101 Skate Blvd",
      city: "Seattle",
      state: "WA",
      zipCode: "98103",
    },
    registration: {
      type: "dropin",
      maxCapacity: 200,
      currentCapacity: 0,
    },
    content: {
      highlights: [
        "Roller skating",
        "Live music",
        "Fundraising",
        "Community fun",
      ],
      whatToBring: [
        "Comfortable clothes",
        "Skates if you have them (rentals available)",
      ],
      ageRange: "All ages welcome",
      skillLevel: "All levels",
      activities: ["Skating", "Live music", "Raffle", "Food and drinks"],
    },
    media: {
      imagePath: "/roller-skating.jpg",
      imageUrl: "/roller-skating.jpg",
      flyerUrl: "/roller-skating-flyer.pdf",
    },
    contact: {
      organizerName: "J9 Legacy Foundation",
      organizerEmail: "info@j9legacy.org",
      organizerPhone: "(206) 555-0123",
    },
    tags: ["roller skating", "fundraiser", "music", "community"],
    createdAt: getTimestamp(-7),
    updatedAt: getTimestamp(-1),
    createdBy: "system",
    updatedBy: "system",
    slug: "roller-skating-fundraiser",
    metaDescription: "Roller skating fundraiser event in Seattle",
    featuredImage: "/roller-skating.jpg",
    isActive: true,
  },

  // Event in a week
  {
    id: "basketball-clinic",
    title: "Youth Basketball Skills Clinic",
    description:
      "Join us for an intensive basketball skills clinic designed to improve shooting, dribbling, and teamwork. Open to players of all skill levels with professional coaching.",
    shortDescription:
      "Intensive basketball skills clinic with professional coaching for youth players.",
    isFeatured: false,
    schedule: {
      startTime: getTimestamp(7, 9, 0), // 1 week from now at 9 AM
      endTime: getTimestamp(7, 15, 0), // 1 week from now at 3 PM
    },
    location: {
      name: "Seattle Basketball Academy",
      address: "1111 Hoops Lane",
      city: "Seattle",
      state: "WA",
      zipCode: "98104",
    },
    registration: {
      type: "required",
      deadline: getTimestamp(5, 23, 59), // 2 days before event
      maxCapacity: 30,
      currentCapacity: 0,
      cost: 50,
      formSchema: {
        fields: {
          parentName: {
            type: "string",
            label: "Parent/Guardian Name",
            required: true,
          },
          parentEmail: { type: "email", label: "Parent Email", required: true },
          parentPhone: { type: "phone", label: "Parent Phone", required: true },
          medicalInfo: {
            type: "textarea",
            label: "Medical Information",
            required: false,
          },
          waiver: {
            type: "boolean",
            label: "I agree to the waiver",
            required: true,
          },
        },
        participantSchema: {
          fields: {
            name: { type: "string", label: "Participant Name", required: true },
            age: {
              type: "number",
              label: "Age",
              required: true,
              validation: { min: 10, max: 16 },
            },
            experience: {
              type: "select",
              label: "Experience Level",
              required: true,
              validation: { options: ["Beginner", "Intermediate", "Advanced"] },
            },
            position: {
              type: "select",
              label: "Preferred Position",
              required: false,
              validation: {
                options: ["Guard", "Forward", "Center", "No preference"],
              },
            },
          },
          maxParticipants: 2,
          allowMultiple: true,
        },
      },
    },
    content: {
      highlights: [
        "Professional coaching",
        "Skill development",
        "Team building",
      ],
      whatToBring: [
        "Basketball shoes",
        "Water bottle",
        "Lunch",
        "Change of clothes",
      ],
      ageRange: "10-16 years",
      skillLevel: "All levels welcome",
      activities: [
        "Shooting drills",
        "Dribbling practice",
        "Team scrimmages",
        "Game strategy",
      ],
    },
    media: {
      imagePath: "/basketball-clinic.jpg",
      imageUrl: "/basketball-clinic.jpg",
      flyerUrl: "/basketball-clinic-flyer.pdf",
    },
    contact: {
      organizerName: "J9 Legacy Foundation",
      organizerEmail: "info@j9legacy.org",
      organizerPhone: "(206) 555-0123",
    },
    tags: ["basketball", "skills clinic", "coaching", "youth"],
    createdAt: getTimestamp(-3),
    updatedAt: getTimestamp(-3),
    createdBy: "system",
    updatedBy: "system",
    slug: "basketball-clinic",
    metaDescription: "Youth basketball skills clinic in Seattle",
    featuredImage: "/basketball-clinic.jpg",
    isActive: true,
  },
];
