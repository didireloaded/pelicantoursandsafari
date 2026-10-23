import { createFileRoute } from "@tanstack/react-router";
import { TeamSettings } from "@/components/admin/team-settings";
import { StaffDirectory } from "@/components/admin/staff-directory";
import { SampleTeam } from "@/components/admin/sample-team";
import { useAdminSampleMode } from "@/lib/admin-sample-mode";
export const Route = createFileRoute("/_authenticated/admin/team")({
  head: () => ({
    meta: [{ title: "Team — Pelican administration" }, { name: "robots", content: "noindex" }],
  }),
  component: Team,
});
function Team() {
  const { user, adminAssurance } = Route.useRouteContext();
  const sample = useAdminSampleMode();
  if (sample) return <SampleTeam />;
  return (
    <div>
      <h1 className="text-4xl">Team</h1>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Up to five people can share the admin panel. Only an administrator who has verified their
        authenticator can add, change or remove team members.
      </p>
      <div className="mt-8 space-y-8">
        <StaffDirectory userId={user.id} verified={adminAssurance === "aal2"} />
        <TeamSettings verified={adminAssurance === "aal2"} userId={user.id} />
      </div>
    </div>
  );
}
