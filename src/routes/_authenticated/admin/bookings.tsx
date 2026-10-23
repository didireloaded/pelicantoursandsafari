import { createFileRoute } from "@tanstack/react-router";
import { Bookings } from "@/components/admin/bookings";

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  validateSearch: (search: Record<string, unknown>): { reservation?: string } => {
    const reservation = search["reservation"];
    return typeof reservation === "string" && /^[0-9a-f-]{36}$/i.test(reservation)
      ? { reservation }
      : {};
  },
  component: BookingsRoute,
});

function BookingsRoute() {
  const { reservation } = Route.useSearch();
  return <Bookings {...(reservation ? { initialReservation: reservation } : {})} />;
}
