import { addDays, dayUtc, type Workspace } from "./admin-workspace";

/**
 * Fictional presentation records. In memory only; no Supabase inserts, actual contacts,
 * genuine bookings, customer accounts, payments or staff permissions.
 */
const guests = [
  ["Amara Ndlovu", "South Africa", "Website"],
  ["Lukas Weber", "Germany", "Referral"],
  ["Maya Laurent", "France", "WhatsApp"],
  ["Samuel Okonkwo", "Nigeria", "Website"],
  ["Emma Clarke", "United Kingdom", "Referral"],
  ["Noah Williams", "Canada", "Website"],
  ["Nandi Moyo", "Zimbabwe", "Returning client"],
  ["Sofia Rossi", "Italy", "WhatsApp"],
  ["David Müller", "Switzerland", "Website"],
  ["Isabella Chen", "Singapore", "Referral"],
  ["Thabo Dlamini", "South Africa", "Returning client"],
  ["Olivia Martins", "Portugal", "Website"],
] as const;

const examples = [
  ["Etosha wildlife safari", "etosha", 3, 2, "confirmed", 24800, 12000],
  ["Namib Desert and Sossusvlei", "sossusvlei-deadvlei", 2, 7, "confirmed", 19800, 19800],
  ["Swakopmund coastal experience", "swakopmund-walvis-bay", 2, 10, "confirmed", 13200, 4000],
  ["Spitzkoppe landscape tour", "spitzkoppe", 2, 14, "draft", 9200, 0],
  ["Etosha family adventure", "etosha", 4, 18, "confirmed", 46800, 22000],
  ["Kavango and Zambezi route", "kavango-zambezi", 5, 24, "confirmed", 58500, 18000],
  ["Windhoek city discovery", "windhoek", 1, -3, "confirmed", 3200, 3200],
  ["Skeleton Coast expedition", "skeleton-coast", 3, 31, "draft", 34500, 0],
  ["Victoria Falls extension", "victoria-falls", 3, 39, "confirmed", 29700, 8000],
  ["Chobe wildlife journey", "chobe", 3, 45, "cancelled", 27500, 0],
] as const;

const enquiryStatuses = [
  "new",
  "contacted",
  "building_itinerary",
  "quote_sent",
  "new",
  "contacted",
  "confirmed",
  "quote_sent",
  "building_itinerary",
  "new",
  "closed",
  "contacted",
] as const;

const interests = [
  "Three nights in Etosha with a focus on wildlife photography.",
  "Two adults planning a self-paced dunes and desert itinerary.",
  "A coastal weekend with space for activities and local food.",
  "Looking for landscape locations and a private guide.",
  "Family safari with two children, flexible travel dates.",
  "Interested in the river regions and nature excursions.",
  "Short Windhoek city tour before departure.",
  "Asking about a Skeleton Coast route and possible stays.",
  "Victoria Falls extension after a Namibia holiday.",
  "Wildlife viewing and a Chobe river excursion.",
  "Considering Namibia for a future family holiday.",
  "Interested in a multi-stop itinerary and accommodation.",
] as const;

export const sampleStaff = [
  {
    id: "sample-team-1",
    name: "Naledi Mbeki",
    role: "Administrator",
    title: "Operations lead",
    initials: "NM",
    email: "naledi@example.com",
    bio: "Coordinates bookings and manages access to the private workspace.",
  },
  {
    id: "sample-team-2",
    name: "Daniel Strauss",
    role: "Team member",
    title: "Reservations coordinator",
    initials: "DS",
    email: "daniel@example.com",
    bio: "Reviews incoming requests and keeps travel dates up to date.",
  },
  {
    id: "sample-team-3",
    name: "Fiona Banda",
    role: "Team member",
    title: "Guest relations",
    initials: "FB",
    email: "fiona@example.com",
    bio: "Supports client communication and travel preparation.",
  },
  {
    id: "sample-team-4",
    name: "Tariq Dube",
    role: "Team member",
    title: "Content coordinator",
    initials: "TD",
    email: "tariq@example.com",
    bio: "Prepares package drafts and manages destination imagery.",
  },
] as const;

export function sampleWorkspace(today = dayUtc()): Workspace {
  const clients: Workspace["clients"] = guests.map(([name, country, source], i) => ({
    id: `sample-client-${i + 1}`,
    name,
    country,
    source,
    email: `traveller-${String(i + 1).padStart(2, "0")}@example.com`,
    phone: "",
    notes: "Illustrative profile for the Pelican admin presentation. Not a real client.",
    avatar_path: null,
    archived: false,
    revision: 1,
    created_at: `${addDays(today, -(i + 3) * 3)}T09:00:00.000Z`,
    updated_at: `${today}T09:00:00.000Z`,
  }));
  const trips: Workspace["trips"] = examples.map(
    ([title, destination, nights, offset, status, total, paid], i) => ({
      id: `sample-trip-${i + 1}`,
      client_id: clients[i]!.id,
      traveller_id: null,
      title,
      starts_on: addDays(today, offset),
      status,
      stops: [{ destination, nights }],
      total_nad: total,
      paid_nad: paid,
      created_at: `${addDays(today, -24 + i)}T10:00:00.000Z`,
      updated_at: `${today}T10:00:00.000Z`,
    }),
  );
  const leads: Workspace["leads"] = clients.map((client, i) => {
    const status = enquiryStatuses[i]!;
    return {
      id: `sample-enquiry-${i + 1}`,
      name: client.name,
      email: client.email,
      phone: "",
      booking_ref: status === "confirmed" ? `SAMPLE-${i + 101}` : null,
      confirmed_starts_on: status === "confirmed" ? addDays(today, 10) : null,
      confirmed_ends_on: status === "confirmed" ? addDays(today, 12) : null,
      status,
      created_at: `${addDays(today, -i - 1)}T11:00:00.000Z`,
      follow_up_on:
        status === "closed" || status === "confirmed" ? null : addDays(today, (i % 3) - 1),
      residence: client.country,
      brief: interests[i]!,
      trip_code: null,
    };
  });
  const visits: Workspace["visits"] = Array.from({ length: 60 }, (_, i) => ({
    day: addDays(today, i - 59),
    path: i % 3 === 0 ? "/safaris" : "/",
    views: 14 + ((i * 7) % 33),
  }));
  return { clients, trips, leads, visits };
}
