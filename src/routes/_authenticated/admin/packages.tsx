import { createFileRoute } from "@tanstack/react-router";
import { ContentEditor } from "@/components/admin/content-editor";
export const Route = createFileRoute("/_authenticated/admin/packages")({ component: Packages });
function Packages() {
  const { user } = Route.useRouteContext();
  return <ContentEditor kind="package" userId={user.id} />;
}
