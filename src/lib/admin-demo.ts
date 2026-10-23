import { addDays, dayUtc, type Workspace } from "./admin-workspace";

/** Fictional, local-only data for the staff preview. No database identifiers or contacts. */
export function adminDemo(today = dayUtc()): Workspace {
  const created = `${today}T09:00:00.000Z`;
  const clients = [
    {
      id: "demo-ada",
      name: "Ada Example",
      country: "Germany",
      source: "Website" as const,
      email: "",
      phone: "",
      notes: "",
      avatar_path: null,
      archived: false,
      revision: 1,
      created_at: created,
      updated_at: created,
    },
    {
      id: "demo-thabo",
      name: "Thabo Sample",
      country: "South Africa",
      source: "Referral" as const,
      email: "",
      phone: "",
      notes: "",
      avatar_path: null,
      archived: false,
      revision: 1,
      created_at: created,
      updated_at: created,
    },
    {
      id: "demo-maya",
      name: "Maya Example",
      country: "United Kingdom",
      source: "WhatsApp" as const,
      email: "",
      phone: "",
      notes: "",
      avatar_path: null,
      archived: false,
      revision: 1,
      created_at: created,
      updated_at: created,
    },
  ];
  const trips = [
    {
      id: "demo-etosha",
      client_id: "demo-ada",
      traveller_id: null,
      title: "Etosha wildlife journey",
      starts_on: addDays(today, 5),
      status: "confirmed",
      stops: [{ destination: "etosha", nights: 3 }],
      total_nad: 48500,
      paid_nad: 24000,
      created_at: created,
      updated_at: created,
    },
    {
      id: "demo-sossusvlei",
      client_id: "demo-thabo",
      traveller_id: null,
      title: "Sossusvlei journey",
      starts_on: addDays(today, 12),
      status: "confirmed",
      stops: [{ destination: "sossusvlei", nights: 2 }],
      total_nad: 32750,
      paid_nad: 32750,
      created_at: created,
      updated_at: created,
    },
  ];
  const leads = [
    {
      id: "demo-lead-1",
      name: "Maya Example",
      status: "new",
      created_at: created,
      follow_up_on: addDays(today, 2),
      residence: "United Kingdom",
      brief: "Interested in wildlife and landscape photography.",
    },
    {
      id: "demo-lead-2",
      name: "Noah Sample",
      status: "in_progress",
      created_at: created,
      follow_up_on: addDays(today, 3),
      residence: "Canada",
      brief: "Looking for a private Namibia journey.",
    },
  ];
  return { clients, trips, leads, visits: [] };
}
