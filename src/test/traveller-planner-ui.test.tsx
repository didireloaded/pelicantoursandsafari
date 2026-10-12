import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { TravellerItinerary } from "../components/traveller-itinerary";
const { invoke, getSession } = vi.hoisted(() => ({ invoke: vi.fn(), getSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession }, functions: { invoke } },
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
beforeEach(() => {
  invoke.mockReset();
  getSession.mockReset();
});
function fill() {
  fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2099-02-01" } });
  fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2099-02-01" } });
  fireEvent.change(screen.getByLabelText("Total budget per person (NAD)"), {
    target: { value: "10000" },
  });
  fireEvent.click(screen.getAllByRole("checkbox")[0]!);
}
it("requires traveller sign-in and retains entered preferences without invoking the gateway", async () => {
  getSession.mockResolvedValue({ data: { session: null }, error: null });
  render(<TravellerItinerary />);
  fill();
  fireEvent.click(screen.getByRole("button", { name: "Generate itinerary" }));
  expect(await screen.findByText(/Sign in in a new tab/)).toBeTruthy();
  expect(invoke).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Start date")).toHaveValue("2099-02-01");
});
it("shows a failed save honestly, restores the generate action and does not present an itinerary", async () => {
  getSession.mockResolvedValue({ data: { session: { access_token: "test" } }, error: null });
  invoke.mockResolvedValue({ data: null, error: new Error("network") });
  render(<TravellerItinerary />);
  fill();
  fireEvent.click(screen.getByRole("button", { name: "Generate itinerary" }));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("AI planning is unavailable"),
  );
  expect(screen.queryByText("Your provisional itinerary")).toBeNull();
  expect(screen.getByRole("button", { name: "Generate itinerary" })).toBeEnabled();
});
