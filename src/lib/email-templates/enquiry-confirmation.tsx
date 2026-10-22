import * as React from "react";
import { Html, Link, Text } from "@react-email/components";
import { EmailBrand, emailStyles } from "./brand";

export interface EnquiryConfirmationProps {
  name: string;
  reference: string;
  contactPreference: string;
  safariName: string | null;
  bookingRequest?: boolean;
}

/** Sent to the traveller right after their Safari Brief is received. */
export const EnquiryConfirmationEmail = ({
  name,
  reference,
  contactPreference,
  safariName,
  bookingRequest = false,
}: EnquiryConfirmationProps) => (
  <Html>
    <EmailBrand />
    <Text style={emailStyles.h1}>Thank you, {name}</Text>
    <Text style={emailStyles.text}>
      We have received your {bookingRequest ? "booking request" : "safari enquiry"}
      {safariName ? ` inspired by ${safariName}` : ""}. Your reference is{" "}
      <strong>{reference}</strong> — please keep it for any follow-up.
    </Text>
    <Text style={emailStyles.text}>
      Pelican Tours and Safari will get back to you via {contactPreference.toLowerCase()} to talk
      through your plans, availability and price. Your route and accommodation remain preferences
      until Pelican confirms them with you.
    </Text>
    {bookingRequest && (
      <Text style={emailStyles.text}>
        This is a booking request, not a confirmed booking. Pelican will confirm availability, price
        and terms in writing.{" "}
        <Link style={emailStyles.link} href="https://pelicantoursandsafari.com/booking">
          Check my booking
        </Link>{" "}
        using your reference and the email or phone number you submitted.
      </Text>
    )}
    <Text style={emailStyles.text}>
      Prefer to reach us sooner?{" "}
      <Link style={emailStyles.link} href="https://api.whatsapp.com/send?phone=264817618297">
        WhatsApp Kamwi Kays
      </Link>{" "}
      or{" "}
      <Link style={emailStyles.link} href="mailto:info@pelicantoursandsafaris.com">
        email us
      </Link>
      .
    </Text>
    <Text style={emailStyles.footer}>
      Pelican Tours and Safari — 10 Fabri Street, Pionierspark, Windhoek, Namibia. Monday – Friday,
      8:00 – 17:00. You are receiving this email because you sent a safari enquiry through our
      website.
    </Text>
  </Html>
);
