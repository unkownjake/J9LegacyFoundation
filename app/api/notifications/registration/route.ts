import { NextRequest, NextResponse } from "next/server";
import { EventResponse, EventDisplay } from "@/lib/types/events";

interface RegistrationNotificationData {
  event: EventDisplay;
  response: EventResponse;
  participantCount: number;
  totalCost: number;
}

export async function POST(request: NextRequest) {
  try {
    const data: RegistrationNotificationData = await request.json();
    const { event, response, participantCount, totalCost } = data;

    // Create email content
    const emailContent = `
New Registration for: ${event.title}

Registration Details:
- Name: ${response.email}
- Event: ${event.title}
- Date: ${new Date(event.schedule.startTime).toLocaleDateString()}
- Time: ${new Date(event.schedule.startTime).toLocaleTimeString()}
- Location: ${event.location.name}, ${event.location.city}, ${
      event.location.state
    }

Participant Information:
- Number of Participants: ${participantCount}
- Total Cost: $${totalCost}

Registration Form Data:
${Object.entries(response.fields)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

Participant Details:
${response.participants
  .map(
    (participant, index) =>
      `Participant ${index + 1}:\n${Object.entries(participant)
        .map(([key, value]) => `  - ${key}: ${value}`)
        .join("\n")}`
  )
  .join("\n\n")}

Payment Status: ${
      (response.metadata as any)?.paymentStatus === "confirm"
        ? "CONFIRMED"
        : (response.metadata as any)?.paymentStatus === "later"
        ? "PAY LATER"
        : "PENDING VERIFICATION"
    }

Please verify payment and confirm registration.

---
This is an automated notification from the J9 Legacy Foundation registration system.
    `.trim();

    // For now, we'll just log the email content
    // In a real implementation, you would send this via email service
    console.log("=== REGISTRATION NOTIFICATION ===");
    console.log("To: nmaxey@j9legacy.org");
    console.log("Subject: New Registration - " + event.title);
    console.log("Content:");
    console.log(emailContent);
    console.log("================================");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending registration notification:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
