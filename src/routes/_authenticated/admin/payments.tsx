import { createFileRoute } from "@tanstack/react-router";
import { Payments } from "@/components/admin/payments";

export const Route = createFileRoute("/_authenticated/admin/payments")({ component: Payments });
