import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import {
  getEmailHTMLFormat,
  getEmailPlaintextFormat,
} from "@/app/emailTemplates/emailHTMLGenerator";
import { EmailType } from "@/app/emailTemplates/emailConstants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const email = searchParams.get("email");
  const amount = searchParams.get("amount");

  if (!name || !email || !amount) {
    return NextResponse.redirect(
      new URL("/donate?error=missing_info", request.url)
    );
  }

  // Create email transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    const htmlContent = getEmailHTMLFormat(
      name,
      amount,
      EmailType.DONATION_THANK_YOU
    );

    const plaintextContent = getEmailPlaintextFormat(
      name,
      amount,
      EmailType.DONATION_THANK_YOU
    );

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank You for Your Donation to J9 Legacy Foundation",
      html: htmlContent,
      text: plaintextContent,
      attachments: [
        {
          filename: "J9LegacyFoundationLogo.png",
          path: path.join(process.cwd(), "public", "logoForEmail.png"),
          cid: "j9logo",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // Redirect to thank you page with success message
    return NextResponse.redirect(new URL("/donate/thank-you", request.url));
  } catch (error) {
    console.error("Error processing donation:", error);
    return NextResponse.redirect(new URL("/donate/thank-you", request.url));
  }
}
