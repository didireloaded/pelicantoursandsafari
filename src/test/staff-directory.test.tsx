import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({ members: vi.fn(), profiles: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => ({ abortSignal: mocks.members }),
    from: () => ({ select: () => ({ abortSignal: mocks.profiles }) }),
  },
}));
vi.mock("@/components/admin/staff-avatar", () => ({
  StaffAvatar: ({ name }: { name: string }) => <span>{name.slice(0, 1)}</span>,
}));
import { StaffDirectory } from "@/components/admin/staff-directory";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function show(verified = true) {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <StaffDirectory userId="self" verified={verified} />
    </QueryClientProvider>,
  );
}
it("lists active staff, uses saved names and allows editing only one's own profile", async () => {
  mocks.members.mockResolvedValue({
    data: [
      { user_id: "self", email: "self@example.com" },
      { user_id: "other", email: "colleague@example.com" },
    ],
    error: null,
  });
  mocks.profiles.mockResolvedValue({
    data: [
      { user_id: "self", display_name: "My name", avatar_path: null },
      { user_id: "other", display_name: "Colleague", avatar_path: null },
      { user_id: "removed", display_name: "Former staff", avatar_path: null },
    ],
    error: null,
  });
  show();
  expect(await screen.findByRole("heading", { name: "My name" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Colleague" })).toBeVisible();
  expect(screen.queryByText("Former staff")).toBeNull();
  expect(screen.getAllByRole("link", { name: "Edit your profile" })).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Edit your profile" })).toHaveAttribute(
    "href",
    "/admin/profile",
  );
});
it("does not request directory data without verified staff assurance", () => {
  show(false);
  expect(mocks.members).not.toHaveBeenCalled();
  expect(mocks.profiles).not.toHaveBeenCalled();
});
