import { createFileRoute } from "@tanstack/react-router";
import { Analytics } from "@/components/admin/analytics";
export const Route = createFileRoute("/_authenticated/admin/analytics")({ component: Analytics });
