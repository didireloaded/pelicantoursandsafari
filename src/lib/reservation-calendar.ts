import { addDays, tripEnd, type AdminTrip, type Client, type Lead } from "./admin-workspace";
export type ReservationEvent = {
  id: string;
  kind: "trip" | "request";
  name: string;
  title: string;
  startsOn: string;
  endsOn: string;
};
export function reservationEvents(
  trips: AdminTrip[],
  clients: Client[],
  requests: Lead[],
): ReservationEvent[] {
  return [
    ...trips
      .filter((trip) => trip.status === "confirmed")
      .map((trip) => ({
        id: trip.id,
        kind: "trip" as const,
        name: clients.find((client) => client.id === trip.client_id)?.name ?? trip.title,
        title: trip.title,
        startsOn: trip.starts_on,
        endsOn: addDays(tripEnd(trip), -1),
      })),
    ...requests
      .filter(
        (request) =>
          request.status === "confirmed" &&
          request.booking_ref &&
          request.confirmed_starts_on &&
          request.confirmed_ends_on,
      )
      .map((request) => ({
        id: request.id,
        kind: "request" as const,
        name: request.name,
        title: request.booking_ref!,
        startsOn: request.confirmed_starts_on!,
        endsOn: request.confirmed_ends_on!,
      })),
  ].sort((a, b) => a.startsOn.localeCompare(b.startsOn) || a.name.localeCompare(b.name));
}
