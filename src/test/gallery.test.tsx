import type { ComponentType, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ search: {} as { destination?: string } }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => state.search }),
  Link: ({ children, to, search, ...props }: { children: ReactNode; to: string; search?: Record<string, string> }) => <a href={`${to}${search?.["destination"] ? `?destination=${search["destination"]}` : ""}`} {...props}>{children}</a>,
}));
vi.mock("@/components/site", () => ({ Section: ({ children }: { children: ReactNode }) => <section>{children}</section>, meta: () => ({}) }));
vi.mock("@/lib/site-content-api", () => ({ usePublishedContent: () => ({ data: [], isPending: false, isError: false }) }));
import { Route } from "@/routes/gallery";
import { destinations } from "@/lib/pelican";
const options = Route.options as unknown as { component: ComponentType; validateSearch: (s: Record<string, unknown>) => { destination?: string } };
afterEach(() => { cleanup(); state.search = {}; });
it("lists every existing destination as an album without displaying photos", () => {
  render(<options.component />);
  expect(screen.getByRole("list", { name: "Destination albums" }).children).toHaveLength(destinations.length);
  for (const destination of destinations) expect(screen.getByRole("heading", { name: destination.name }).closest("a")).toHaveAttribute("href", `/gallery?destination=${destination.slug}`);
  expect(screen.queryAllByRole("img")).toHaveLength(0);
});
it("opens a selected destination with an honest empty state and a back link", () => {
  state.search = { destination: "etosha" };
  render(<options.component />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Etosha National Park");
  expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  expect(screen.getByRole("status")).toHaveTextContent("No photos added yet");
  expect(screen.getByRole("link", { name: /All destination albums/ })).toHaveAttribute("href", "/gallery");
  expect(screen.queryByRole("list", { name: "Destination albums" })).toBeNull();
  expect(screen.queryAllByRole("img")).toHaveLength(0);
});
it("accepts only catalogue destinations in shared album URLs", () => {
  expect(options.validateSearch({ destination: "etosha" })).toEqual({ destination: "etosha" });
  for (const destination of ["unknown", "<script>", ["etosha"], undefined]) expect(options.validateSearch({ destination })).toEqual({});
});
