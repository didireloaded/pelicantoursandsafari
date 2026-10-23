import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/preview")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
  head: () => ({
    meta: [
      { title: "Demo preview — Pelican administration" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
