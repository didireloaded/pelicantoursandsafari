import { createServerFn } from "@tanstack/react-start";
import { enquiryAllowedOrigins } from "./enquiry-origins";
import { bookingInput, bookingToEnquiry, bookingStage, bookingRefPattern, tripForCode, type BookingReceipt } from "./booking";

export const requestBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }): Promise<BookingReceipt> => {
    const parsed = bookingInput.safeParse(data);
    if (!parsed.success) return { error: "Please check your booking details." };
    const enquiry = bookingToEnquiry(parsed.data);
    const { getRequest } = await import("@tanstack/react-start/server");
    const { submitServerEnquiry } = await import("./enquiry-submit.server");
    const receipt = await submitServerEnquiry(enquiry, getRequest(), {
      trustedCloudflareIngress: process.env["ENQUIRY_TRUST_CLOUDFLARE_IP"] === "true",
      allowedOrigins: enquiryAllowedOrigins(process.env["ENQUIRY_ALLOWED_ORIGINS"]),
      rateSalt: process.env["ENQUIRY_RATE_SALT"],
      databaseUrl: process.env["SUPABASE_URL"],
      serviceKey: process.env["SUPABASE_SERVICE_ROLE_KEY"],
    });
    if (!receipt.reference) return { error: receipt.error ?? "Request not confirmed. Please retry." };
    const { serviceRpc } = await import("./booking.server");
    let bookingRef: string;
    try {
      bookingRef = await serviceRpc<string>("assign_booking_ref", { _enquiry: receipt.reference, _trip_code: parsed.data.trip_code });
    } catch (error) {
      console.error("Booking reference failed:", error);
      return { error: "Your request is saved but its reference could not be created. Retry the same request." };
    }
    const { sendEnquiryEmails } = await import("./enquiry-emails.server");
    const emails = await sendEnquiryEmails(enquiry, receipt.reference, bookingRef);
    if (!emails.traveller.sent || !emails.pelican.sent) console.error("Booking emails incomplete:", emails);
    return { bookingRef };
  });

export type BookingLookup = { found: true; tripName: string; tripCode: string; stage: string; requestedAt: string } | { found: false; error?: string };

export const lookupBooking = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const v = d as { ref?: unknown; contact?: unknown };
    if (typeof v?.ref !== "string" || typeof v?.contact !== "string") throw new Error("Invalid lookup");
    return { ref: v.ref.trim().toUpperCase().slice(0, 20), contact: v.contact.trim().slice(0, 255) };
  })
  .handler(async ({ data }): Promise<BookingLookup> => {
    if (!bookingRefPattern.test(data.ref) || data.contact.length < 3) return { found: false };
    const { getRequest } = await import("@tanstack/react-start/server");
    const { serviceRpc, networkHash } = await import("./booking.server");
    const address = getRequest().headers.get("cf-connecting-ip")?.trim();
    const salt = process.env["ENQUIRY_RATE_SALT"];
    if (!address || !salt) return { found: false, error: "Booking look-up is unavailable. Please contact Pelican." };
    try {
      const rows = await serviceRpc<{ trip_code: string; status: string; created_at: string }[]>("lookup_booking", {
        _ref: data.ref, _contact: data.contact, _network_hash: await networkHash(salt, address),
      });
      const row = rows[0];
      if (!row) return { found: false };
      return { found: true, tripCode: row.trip_code, tripName: tripForCode(row.trip_code)?.name ?? row.trip_code, stage: bookingStage(row.status), requestedAt: row.created_at };
    } catch (error) {
      const limited = error instanceof Error && error.message.includes("Rate limit");
      return { found: false, error: limited ? "Too many look-ups. Please try again later." : "Booking look-up is unavailable. Please contact Pelican." };
    }
  });
