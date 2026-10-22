import { createFileRoute } from "@tanstack/react-router";
import { ContentEditor } from "@/components/admin/content-editor";
export const Route = createFileRoute("/_authenticated/admin/gallery")({ component: Gallery });
function Gallery() {
  const { user } = Route.useRouteContext();
  return <ContentEditor kind="photo" userId={user.id} />;
}
