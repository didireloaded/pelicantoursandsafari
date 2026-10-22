import { createFileRoute } from "@tanstack/react-router";
import { StaffDirectory } from "@/components/admin/staff-directory";
export const Route = createFileRoute("/_authenticated/admin/staff")({
  head: () => ({
    meta: [
      { title: "Staff directory — Pelican administration" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Directory,
});
function Directory() {
  const { user, adminAssurance } = Route.useRouteContext();
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">YOUR PEOPLE</p>
          <h1 className="mt-2">Staff directory</h1>
          <p>Names and photos, visible only to verified staff.</p>
        </div>
      </div>
      <StaffDirectory userId={user.id} verified={adminAssurance === "aal2"} />
    </>
  );
}
