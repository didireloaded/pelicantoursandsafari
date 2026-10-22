import { createFileRoute } from "@tanstack/react-router";
import { Bookings } from "@/components/admin/bookings";
export const Route = createFileRoute("/_authenticated/admin/bookings")({ component: Bookings });
