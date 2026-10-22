import { createFileRoute } from "@tanstack/react-router";
import { DemoPreview } from "@/components/admin/demo-preview";

export const Route = createFileRoute("/_authenticated/admin/preview")({
  component: DemoPreview,
  head: () => ({ meta: [{ title: "Demo preview — Pelican administration" }, { name: "robots", content: "noindex" }] }),
});
