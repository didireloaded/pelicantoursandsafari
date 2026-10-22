import { createFileRoute } from "@tanstack/react-router";
import { TeamSettings } from "@/components/admin/team-settings";
export const Route = createFileRoute("/_authenticated/admin/team")({
  head: () => ({
    meta: [{ title: "Team — Pelican administration" }, { name: "robots", content: "noindex" }],
  }),
  component: Team,
});
function Team() {
  const { user, adminAssurance } = Route.useRouteContext();
  return (
    <div>
      <h1 className="text-4xl">Team</h1>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Up to five people can share the admin panel. Only an administrator who has verified their
        authenticator can add, change or remove team members.
      </p>
      <TeamSettings verified={adminAssurance === "aal2"} userId={user.id} />
    </div>
  );
}
