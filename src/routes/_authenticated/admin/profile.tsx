import { createFileRoute } from "@tanstack/react-router";
import { StaffProfile } from "@/components/admin/staff-profile";
export const Route = createFileRoute("/_authenticated/admin/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Pelican administration" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Profile,
});
function Profile() {
  const { user, adminAssurance } = Route.useRouteContext();
  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">YOUR WORKSPACE</p>
          <h1 className="mt-2">Your profile</h1>
          <p>Choose how you appear to the Pelican team.</p>
        </div>
      </div>
      <StaffProfile
        userId={user.id}
        email={user.email ?? "Staff"}
        verified={adminAssurance === "aal2"}
      />
    </div>
  );
}
