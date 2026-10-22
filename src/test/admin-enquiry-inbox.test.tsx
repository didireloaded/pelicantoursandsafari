import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
const mocks = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  updates: [] as { data: unknown; error: unknown }[],
  eq: vi.fn(),
  rpc: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({ options }),
  useBlocker: vi.fn(),
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));
vi.mock("sonner", () => ({ toast: { error: mocks.toast } }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: "staff" } }, error: null }) },
    rpc: async () => ({ data: [], error: null }),
    from(table: string) {
      let patch: unknown;
      const builder = {
        select: () => builder,
        order: () => builder,
        limit: () => builder,
        eq: (key: string, value: unknown) => {
          mocks.eq(key, value);
          return builder;
        },
        update: (value: unknown) => {
          patch = value;
          return builder;
        },
        single: async () => mocks.updates.shift() ?? { data: null, error: { message: "conflict" } },
        then: (resolve: (result: unknown) => unknown, reject: (error: unknown) => unknown) =>
          Promise.resolve({
            data:
              table === "user_roles"
                ? [{ role: "staff" }]
                : table === "enquiries"
                  ? structuredClone(mocks.rows)
                  : [],
            error: null,
          }).then(resolve, reject),
      };
      return builder;
    },
  },
}));
import { Route } from "@/routes/_authenticated/dashboard";
const row = (id: string, name: string) => ({
  id,
  name,
  email: `${id}@example.com`,
  phone: null,
  residence: "Namibia",
  contact_preference: "Email",
  status: "new",
  safari_slug: "big-five-etosha",
  brief: `Message from ${name}`,
  staff_notes: "Original notes",
  assigned_to: null,
  follow_up_on: null,
  created_at: "2026-10-22T10:00:00Z",
  updated_at: "version-1",
  booking_ref: null,
  enquiry_ref: `REF-${id}`,
  trip_code: null,
});
const openNotes = () =>
  fireEvent.mouseDown(screen.getByRole("tab", { name: /Team notes/ }), {
    button: 0,
    ctrlKey: false,
  });
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.updates = [];
});
it("shows one focused enquiry and clears details when filters have no matches", async () => {
  mocks.rows = [row("one", "Guest One"), row("two", "Guest Two")];
  const Page = Route.options.component!;
  render(<Page />);
  await screen.findByText("Message from Guest One");
  expect(screen.queryByText("Message from Guest Two")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Guest Two/ }));
  expect(screen.getByText("Message from Guest Two")).toBeVisible();
  expect(screen.queryByText("Message from Guest One")).toBeNull();
  fireEvent.change(screen.getByLabelText("Search enquiries"), {
    target: { value: "does not match" },
  });
  expect(screen.getByText("No enquiries match your filters.")).toBeVisible();
  expect(screen.queryByText("Message from Guest Two")).toBeNull();
  expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
});
it("retains failed note drafts, compares refreshed notes and saves against the new revision", async () => {
  mocks.rows = [row("one", "Guest One")];
  const Page = Route.options.component!;
  render(<Page />);
  await screen.findByText("Message from Guest One");
  openNotes();
  fireEvent.change(screen.getByLabelText("Private team notes"), { target: { value: "My draft" } });
  fireEvent.click(screen.getByRole("button", { name: "Save notes" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Private team notes")).toHaveValue("My draft");
  expect(mocks.eq).toHaveBeenCalledWith("updated_at", "version-1");
  mocks.rows = [
    { ...row("one", "Guest One"), staff_notes: "Another staff edit", updated_at: "version-2" },
  ];
  fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
  await screen.findByText(/Saved notes changed while you were editing/);
  expect(screen.getByLabelText("Private team notes")).toHaveValue("My draft");
  mocks.updates = [
    { data: { ...mocks.rows[0], staff_notes: "My draft", updated_at: "version-3" }, error: null },
  ];
  fireEvent.click(screen.getByRole("button", { name: "Save my notes" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Save notes" })).toBeDisabled());
  expect(mocks.eq).toHaveBeenCalledWith("updated_at", "version-2");
  expect(screen.getByLabelText("Private team notes")).toHaveValue("My draft");
});
