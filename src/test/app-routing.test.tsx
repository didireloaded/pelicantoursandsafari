import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { destinations, safaris, stays } from "@/lib/pelican";

// Route matching is deliberately separate from live loader/action verification.
const paths = [
  "/",
  "/about",
  "/contact",
  "/gallery",
  "/safaris",
  "/destinations",
  "/stay",
  "/journey",
  "/match",
  "/shortlist",
  "/tailor-made",
  "/travel-guide",
  "/book",
  "/booking",
  "/auth",
  "/reset-password",
  "/trips",
  "/proposals",
  "/dashboard",
  "/trips-manage",
  "/content-manage",
  "/.lovable/oauth/consent",
  ...safaris.map((s) => `/safaris/${s.slug}`),
  ...destinations.map((d) => `/destinations/${d.slug}`),
  ...stays.map((s) => `/stay/${s.slug}`),
];
describe("App routing", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  it.each(paths)("matches %s to an existing page", (path) => {
    const matches = router.matchRoutes(path);
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.at(-1)?.routeId).toBeDefined();
  });
});
