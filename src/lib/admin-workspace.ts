import { z } from "zod";
import { validateJourney, type JourneyStop } from "./journey";
export const clientSources = [
  "Website",
  "WhatsApp",
  "Referral",
  "Returning client",
  "Other",
  "Unknown",
] as const;
const path = z
  .string()
  .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/)
  .nullable();
export const clientSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    country: z.string().trim().max(100),
    email: z.union([z.literal(""), z.string().email().max(255)]),
    phone: z.string().trim().max(50),
    source: z.enum(clientSources),
    notes: z.string().trim().max(5000),
    avatar_path: path,
    archived: z.boolean(),
  })
  .strict();
export type ClientInput = z.infer<typeof clientSchema>;
export type Client = ClientInput & {
  id: string;
  revision: number;
  updated_at: string;
  created_at: string;
};
export const blankClient = (): ClientInput => ({
  name: "",
  country: "",
  email: "",
  phone: "",
  source: "Unknown",
  notes: "",
  avatar_path: null,
  archived: false,
});
export type AdminTrip = {
  id: string;
  client_id: string | null;
  traveller_id: string | null;
  title: string;
  starts_on: string;
  status: string;
  stops: unknown;
  total_nad: number | null;
  paid_nad: number | null;
  updated_at: string;
  created_at: string;
};
export type Lead = {
  id: string;
  name: string;
  status: string;
  created_at: string;
  follow_up_on: string | null;
  residence: string | null;
};
export type Visit = { day: string; path: string; views: number };
export type Workspace = { clients: Client[]; trips: AdminTrip[]; leads: Lead[]; visits: Visit[] };
export const blankWorkspace = (): Workspace => ({ clients: [], trips: [], leads: [], visits: [] });
export function dayUtc(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
export function addDays(day: string, days: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return dayUtc(d);
}
export function tripEnd(trip: Pick<AdminTrip, "starts_on" | "stops">) {
  return addDays(
    trip.starts_on,
    validateJourney(trip.stops).reduce((sum, stop) => sum + stop.nights, 0),
  );
}
export function isActiveTrip(trip: AdminTrip, today = dayUtc()) {
  return trip.status === "confirmed" && trip.starts_on <= today && tripEnd(trip) > today;
}
export function clientPaid(clientId: string, trips: AdminTrip[]) {
  const values = trips.filter((trip) => trip.client_id === clientId && trip.paid_nad !== null);
  return values.length ? values.reduce((sum, trip) => sum + Number(trip.paid_nad), 0) : null;
}
export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "P"
  );
}
const money = z.number().finite().min(0).max(100000000).nullable();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const d = new Date(value + "T00:00:00Z");
    return Number.isFinite(d.getTime()) && dayUtc(d) === value;
  }, "Choose a valid date.");
export const bookingSchema = z
  .object({
    client_id: z.string().uuid(),
    traveller_id: z.string().uuid().nullable(),
    title: z.string().trim().min(1).max(200),
    starts_on: date,
    status: z.enum(["draft", "confirmed", "cancelled"]),
    stops: z
      .array(
        z
          .object({
            destination: z.string(),
            nights: z.number().int().min(1).max(90),
            stay: z.string().optional(),
          })
          .strict(),
      )
      .min(1)
      .max(30)
      .refine(
        (stops) => JSON.stringify(validateJourney(stops)) === JSON.stringify(stops),
        "Check the itinerary stops.",
      ),
    total_nad: money,
    paid_nad: money,
  })
  .strict()
  .refine(
    (value) =>
      value.total_nad === null || value.paid_nad === null || value.paid_nad <= value.total_nad,
    "Received amount cannot exceed the recorded trip total.",
  );
export type BookingInput = z.infer<typeof bookingSchema>;
export const blankBooking = (): BookingInput => ({
  client_id: "",
  traveller_id: null,
  title: "",
  starts_on: dayUtc(),
  status: "draft",
  stops: [{ destination: "etosha", nights: 1 }],
  total_nad: null,
  paid_nad: null,
});
export function periodSummary(data: Workspace, days: number, today = dayUtc()) {
  const start = addDays(today, 1 - days);
  const inPeriod = (day: string) => day.slice(0, 10) >= start && day.slice(0, 10) <= today;
  return {
    views: data.visits.filter((v) => inPeriod(v.day)).reduce((sum, v) => sum + Number(v.views), 0),
    leads: data.leads.filter((l) => inPeriod(l.created_at)).length,
    bookings: data.trips.filter((t) => t.status === "confirmed" && inPeriod(t.starts_on)).length,
    value: data.trips
      .filter((t) => t.status === "confirmed" && inPeriod(t.starts_on) && t.total_nad !== null)
      .reduce((sum, t) => sum + Number(t.total_nad), 0),
  };
}
export function assistantContext(data: Workspace) {
  const period = periodSummary(data, 30);
  const today = dayUtc();
  return {
    asOf: today,
    last30Days: period,
    clients: data.clients.filter((c) => !c.archived).length,
    activeBookings: data.trips.filter((t) => isActiveTrip(t, today)).length,
    upcomingBookings: data.trips.filter((t) => t.status === "confirmed" && t.starts_on > today)
      .length,
    openEnquiries: data.leads.filter((l) => !["closed", "confirmed"].includes(l.status)).length,
    overdueFollowUps: data.leads.filter(
      (l) =>
        l.follow_up_on && l.follow_up_on < today && !["closed", "confirmed"].includes(l.status),
    ).length,
    publishedFacts:
      "Packages and photos are managed through draft, preview and publish. An enquiry is not a reservation. Recorded trip totals are not processed payments. Page views are not unique visitors.",
  };
}
export type { JourneyStop };
