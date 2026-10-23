import { describe, expect, it } from "vitest";
import { sampleStaff, sampleWorkspace } from "@/lib/admin-sample-data";
import { reservationEvents } from "@/lib/reservation-calendar";
import { destinations } from "@/lib/pelican";
import { dayUtc } from "@/lib/admin-workspace";

describe("client presentation samples", () => {
  const data = sampleWorkspace("2026-10-23");
  it("provides substantial records for the client presentation", () => {
    expect(data.clients).toHaveLength(12);
    expect(data.trips).toHaveLength(10);
    expect(data.leads).toHaveLength(12);
    expect(data.visits).toHaveLength(60);
    expect(sampleStaff).toHaveLength(4);
  });
  it("keeps fictional records separate from database identifiers", () => {
    expect(
      data.clients.every(
        (client) => client.id.startsWith("sample-") && client.email.endsWith("@example.com"),
      ),
    ).toBe(true);
    expect(
      data.trips.every((trip) => trip.id.startsWith("sample-") && trip.traveller_id === null),
    ).toBe(true);
    expect(data.leads.every((lead) => lead.id.startsWith("sample-"))).toBe(true);
    expect(
      sampleStaff.every(
        (staff) => staff.id.startsWith("sample-") && staff.email.endsWith("@example.com"),
      ),
    ).toBe(true);
  });
  it("links all trip records to sample clients and valid destinations", () => {
    expect(
      data.trips.every((trip) => data.clients.some((client) => client.id === trip.client_id)),
    ).toBe(true);
    expect(
      data.trips.every((trip) => {
        const stops = trip.stops as { destination: string; nights: number }[];
        return stops.every(
          (stop) =>
            destinations.some((destination) => destination.slug === stop.destination) &&
            stop.nights > 0,
        );
      }),
    ).toBe(true);
    expect(reservationEvents(data.trips, data.clients, data.leads).length).toBeGreaterThanOrEqual(
      6,
    );
  });
  it("does not depend on real customer data or mutable database state", () => {
    expect(data.clients[0]?.name).toBe("Amara Ndlovu");
    expect(sampleWorkspace("2026-10-23")).toEqual(data);
    expect(dayUtc(new Date("2026-10-23T00:00:00Z"))).toBe("2026-10-23");
  });
});
