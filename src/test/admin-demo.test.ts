import { describe, expect, it } from "vitest";
import { adminDemo } from "@/lib/admin-demo";
import { reservationEvents } from "@/lib/reservation-calendar";

describe("staff demo preview", () => {
  it("shows fictional confirmed journeys without contact, price, or live identifiers", () => {
    const data = adminDemo("2026-10-23");
    expect(data.clients).toHaveLength(3);
    expect(data.clients.every((client) => client.id.startsWith("demo-") && !client.email && !client.phone)).toBe(true);
    expect(data.trips.every((trip) => trip.id.startsWith("demo-") && trip.total_nad === null && trip.paid_nad === null)).toBe(true);
    expect(reservationEvents(data.trips, data.clients, data.leads)).toHaveLength(2);
  });
});
