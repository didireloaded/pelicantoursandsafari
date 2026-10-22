import { createFileRoute, redirect } from "@tanstack/react-router";

/** Staff profiles are managed in Team. */
export const Route = createFileRoute("/_authenticated/admin/staff")({
  beforeLoad: () => { throw redirect({ to: "/admin/team" }); },
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
});
