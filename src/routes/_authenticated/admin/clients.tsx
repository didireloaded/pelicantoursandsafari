import { createFileRoute } from "@tanstack/react-router";
import { Clients } from "@/components/admin/clients";
export const Route = createFileRoute("/_authenticated/admin/clients")({ component: Page });
function Page() {
  const { user } = Route.useRouteContext();
  return <Clients userId={user.id} />;
}
