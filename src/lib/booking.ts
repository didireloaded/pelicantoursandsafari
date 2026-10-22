import { z } from "zod";
import { safaris } from "./pelican";

/** One fixed code per bookable trip; shared by every traveller who requests it. */
export const tripCodes: Record<string, string> = {
  "big-five-etosha": "ENP1",
  "windhoek-city-tour": "WCT1",
  "namibian-highlights": "NHL1",
  "cross-border": "CBT1",
};
export const TAILOR_MADE_CODE = "TMS1";

export type BookableTrip = { code: string; name: string; slug: string | null };
export const bookableTrips: BookableTrip[] = [
  ...safaris.flatMap((s) =>
    tripCodes[s.slug] ? [{ code: tripCodes[s.slug]!, name: s.name, slug: s.slug }] : [],
  ),
  { code: TAILOR_MADE_CODE, name: "Tailor-made safari", slug: null },
];
export const tripForCode = (code: string) => bookableTrips.find((t) => t.code === code);
export const tripCodeFor = (slug: string) => tripCodes[slug];

/** Private per-request reference: trip code + 4 unambiguous characters. */
export const bookingRefPattern = /^[A-Z]{3}[0-9]{1,2}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

export const bookingInput = z
  .object({
    request_id: z.string().uuid(),
    trip_code: z.string().refine((c) => !!tripForCode(c), "Unknown trip"),
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(255).nullable(),
    phone: z.string().trim().min(1).max(50).nullable(),
    contact_preference: z.enum(["WhatsApp", "Email", "Phone"]),
    dates: z.string().trim().min(1).max(200),
    travellers: z.number().int().min(1).max(60),
    notes: z.string().trim().max(4000),
  })
  .strict()
  .refine((v) => !!(v.email || v.phone), "Provide email or phone.");
export type BookingInput = z.infer<typeof bookingInput>;
export type BookingReceipt =
  | { bookingRef: string; emailStatus: "sent" | "failed" | "not_provided"; error?: never }
  | { error: string; bookingRef?: never };

/** Converts a booking request into the existing enquiry shape. */
export function bookingToEnquiry(b: BookingInput) {
  const trip = tripForCode(b.trip_code)!;
  return {
    request_id: b.request_id,
    name: b.name,
    email: b.email,
    phone: b.phone,
    residence: null,
    contact_preference: b.contact_preference,
    safari_slug: trip.slug,
    brief: [
      `Booking request — ${trip.name} (trip code ${trip.code})`,
      `Preferred dates: ${b.dates}`,
      `Travellers: ${b.travellers}`,
      b.notes ? `Notes: ${b.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export type BookingStage = "Received" | "Under review" | "Confirmed" | "Closed";
export function bookingStage(status: string): BookingStage {
  if (["contacted", "building_itinerary", "quote_sent"].includes(status)) return "Under review";
  if (status === "confirmed") return "Confirmed";
  if (status === "closed") return "Closed";
  return "Received";
}
export const bookingStages: BookingStage[] = ["Received", "Under review", "Confirmed"];
