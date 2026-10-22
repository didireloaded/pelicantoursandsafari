import { createFileRoute, redirect } from "@tanstack/react-router";

/** Old demo preview bookmarks now lead to the unified admin workspace. */
export const Route = createFileRoute("/_authenticated/admin/preview")({
  beforeLoad: () => { throw redirect({ to: "/admin" }); },
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
});
