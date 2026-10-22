import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({
  admin: false,
  rows: [] as { user_id: string; email: string; role: string }[],
  fail: false,
  rpc: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (name: string, args: unknown) => {
      state.rpc(name, args);
      const result = {
        data:
          name === "can_manage_team" ? state.admin : name === "team_members" ? state.rows : null,
        error:
          name === "set_team_member" && state.fail
            ? { message: "Account must sign in and verify its email first" }
            : null,
      };
      return Object.assign(Promise.resolve(result), { abortSignal: async () => result });
    },
  },
}));
import { TeamSettings } from "@/components/admin/team-settings";
const owner = "00000000-0000-4000-8000-000000000001";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  state.fail = false;
});
it("keeps approval controls away from regular staff", async () => {
  state.admin = false;
  render(<TeamSettings verified userId={owner} />);
  await screen.findByText(/A team administrator manages approved accounts/);
  expect(screen.queryByLabelText("Approved email")).toBeNull();
  expect(state.rpc).not.toHaveBeenCalledWith("set_team_member", expect.anything());
});
it("keeps the approved email after a failed grant and disables a sixth seat", async () => {
  state.admin = true;
  state.rows = [{ user_id: owner, email: "owner@example.com", role: "admin" }];
  state.fail = true;
  const { rerender } = render(<TeamSettings verified userId={owner} />);
  await screen.findByLabelText("Approved email");
  fireEvent.change(screen.getByLabelText("Approved email"), {
    target: { value: "new@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add member" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Approved email")).toHaveValue("new@example.com");
  expect(state.rpc).toHaveBeenCalledWith("set_team_member", {
    _email: "new@example.com",
    _role: "staff",
  });
  state.rows = Array.from({ length: 5 }, (_, i) => ({
    user_id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    email: `user${i}@example.com`,
    role: i ? "staff" : "admin",
  }));
  fireEvent.click(screen.getByRole("button", { name: "Refresh team access" }));
  await screen.findByText("All five places are in use.");
  await waitFor(() => expect(screen.getByRole("button", { name: "Add member" })).toBeDisabled());
});
