import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({
  assurance: "aal2",
  listFactors: vi.fn(async () => ({
    data: { totp: [{ id: "factor", status: "verified" }] },
    error: null,
  })),
  challengeAndVerify: vi.fn(async () => ({ data: {}, error: null })),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  createFileRoute: () => (config: object) => ({
    options: config,
    useRouteContext: () => ({
      user: { id: "staff-1", email: "staff@example.com", email_confirmed_at: "2026-01-01" },
      adminAssurance: state.assurance,
    }),
  }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: state.listFactors,
        challengeAndVerify: state.challengeAndVerify,
      },
    },
  },
}));
vi.mock("@/components/admin/staff-profile", () => ({
  StaffProfile: () => <div>Your profile</div>,
}));
import { Route } from "@/routes/_authenticated/admin/account";
afterEach(cleanup);
it("shows verified security status without redundant setup or codes", async () => {
  state.assurance = "aal2";
  const Account = Route.options.component!;
  render(<Account />);
  await waitFor(() => expect(state.listFactors).toHaveBeenCalled());
  expect(screen.getByText("Email verified")).toBeVisible();
  expect(screen.getByText(/Your sign-in is verified/)).toBeVisible();
  expect(screen.queryByLabelText("Authenticator code")).toBeNull();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
});

it("offers a thirty-day trusted-device choice before authenticator verification", async () => {
  state.assurance = "aal1";
  const Account = Route.options.component!;
  render(<Account />);
  expect(await screen.findByLabelText(/Trust this device for 30 days/)).toBeChecked();
  expect(screen.getByText(/Signing out removes this trust/)).toBeVisible();
});
