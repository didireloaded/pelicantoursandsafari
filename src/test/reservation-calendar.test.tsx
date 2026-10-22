import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import { ReservationCalendar } from "@/components/admin/reservation-calendar";
import { reservationEvents } from "@/lib/reservation-calendar";
import { dayUtc, type Lead, type AdminTrip } from "@/lib/admin-workspace";
afterEach(cleanup);
const today = dayUtc();
const request = (id: string, status = "confirmed"): Lead => ({
  id,
  name: `Traveller ${id}`,
  status,
  created_at: today,
  follow_up_on: null,
  residence: null,
  booking_ref: `ENP1-${id}`,
  confirmed_starts_on: today,
  confirmed_ends_on: today,
});
it("includes only confirmed requests with actual dates and confirmed reservations", () => {
  const trip: AdminTrip = {
    id: "trip",
    client_id: null,
    traveller_id: "traveller",
    title: "Etosha",
    status: "confirmed",
    starts_on: today,
    stops: [{ destination: "etosha", nights: 1 }],
    total_nad: null,
    paid_nad: null,
    created_at: today,
    updated_at: today,
  };
  const events = reservationEvents(
    [
      trip,
      { ...trip, id: "draft", status: "draft" },
      { ...trip, id: "cancelled", status: "cancelled" },
    ],
    [],
    [
      request("ABCD"),
      request("EFGH", "new"),
      request("JKLM", "closed"),
      { ...request("NPQR"), confirmed_starts_on: null, confirmed_ends_on: null },
    ],
  );
  expect(events.map((event) => event.id).sort()).toEqual(["ABCD", "trip"]);
  expect(events[0]?.endsOn).toBe(today);
});
it("opens the selected traveller and expands a busy day without hiding other bookings", () => {
  const select = vi.fn();
  const events = reservationEvents(
    [],
    [],
    [request("ABCD"), request("EFGH"), request("JKLM"), request("NPQR")],
  );
  render(<ReservationCalendar events={events} onSelect={select} />);
  fireEvent.click(screen.getByRole("button", { name: `Traveller ABCD — ENP1-ABCD on ${today}` }));
  expect(select).toHaveBeenCalledWith(expect.objectContaining({ id: "ABCD", kind: "request" }));
  expect(
    screen.queryByRole("button", { name: `Traveller NPQR — ENP1-NPQR on ${today}` }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "+1 more" }));
  expect(
    screen.getByRole("button", { name: `Traveller NPQR — ENP1-NPQR on ${today}` }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Next month" }));
  expect(
    screen.queryByRole("button", { name: `Traveller ABCD — ENP1-ABCD on ${today}` }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Today" }));
  expect(
    screen.getByRole("button", { name: `Traveller ABCD — ENP1-ABCD on ${today}` }),
  ).toBeVisible();
});
