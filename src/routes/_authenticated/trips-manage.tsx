import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/trips-manage")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/bookings" });
  },
});
