"use client";

import { EventDisplay, EventResponse } from "@/lib/types/events";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

interface ExportResponsesButtonProps {
  event: EventDisplay | null;
  responses: EventResponse[];
}

export default function ExportResponsesButton({
  event,
  responses,
}: ExportResponsesButtonProps) {
  const handleExportToExcel = () => {
    if (!event || responses.length === 0) return;

    // Sheet 1: Responses
    const responsesData = responses.map((response) => {
      const row: any = {
        "Response ID": response.id,
        Email: response.email,
        Submitted: new Date(response.time).toLocaleString(),
        "Participants Count": response.participants.length,
        "Payment Verified": response.registrationVerified ? "Yes" : "No",
      };

      // Add form fields (no special prefix)
      Object.entries(response.fields).forEach(([key, value]) => {
        row[key] = String(value);
      });

      // Add metadata fields (label as `${MetadataKey} (Metadata)`)
      if (response.metadata) {
        Object.entries(response.metadata).forEach(([key, value]) => {
          if (key === "paymentStatus") {
            row["paymentStatus (Metadata)"] =
              value === "confirm"
                ? "Confirmed"
                : value === "later"
                ? "Pay Later"
                : "Not Specified";
          } else if (key === "paymentLinksClicked") {
            const links = value as any;
            row["paymentLinksClicked.venmo (Metadata)"] = links?.venmo
              ? "Yes"
              : "No";
            row["paymentLinksClicked.paypal (Metadata)"] = links?.paypal
              ? "Yes"
              : "No";
          } else {
            row[`${key} (Metadata)`] = String(value);
          }
        });
      }

      return row;
    });

    // Sheet 2: Participants
    const participantsData: any[] = [];
    responses.forEach((response) => {
      response.participants.forEach((participant, participantIndex) => {
        const row: any = {
          "Response ID": response.id,
          "Payment Verified": response.registrationVerified ? "Yes" : "No",
          "paymentStatus (Metadata)":
            response.metadata?.paymentStatus === "confirm"
              ? "Confirmed"
              : response.metadata?.paymentStatus === "later"
              ? "Pay Later"
              : "Not Specified",
        };

        // Add participant fields (no special prefix)
        Object.entries(participant).forEach(([key, value]) => {
          row[key] = String(value);
        });

        participantsData.push(row);
      });
    });

    // Create workbook with two sheets
    const wb = XLSX.utils.book_new();

    // Add responses sheet
    const ws1 = XLSX.utils.json_to_sheet(responsesData);
    XLSX.utils.book_append_sheet(wb, ws1, "Responses");

    // Add participants sheet
    const ws2 = XLSX.utils.json_to_sheet(participantsData);
    XLSX.utils.book_append_sheet(wb, ws2, "Participants");

    // Generate filename
    const eventTitle = event.title.replace(/[^a-zA-Z0-9]/g, "_");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `J9_${eventTitle}_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  if (!responses?.length) return null;

  return (
    <button
      onClick={handleExportToExcel}
      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap"
    >
      <Download className="h-4 w-4 mr-2" />
      Export to Excel
    </button>
  );
}
