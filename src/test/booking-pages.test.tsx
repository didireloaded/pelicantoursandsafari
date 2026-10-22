import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
const mocks = vi.hoisted(() => ({ send: vi.fn(), lookup: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({ options, useSearch: () => ({ trip: "CBT1" }) }),
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/booking.functions", () => ({
  requestBooking: mocks.send,
  lookupBooking: mocks.lookup,
}));
import { Route as BookRoute } from "@/routes/book";
import { Route as LookupRoute } from "@/routes/booking";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("retains trip context and details after failure, retries with the same request ID, and shows a receipt", async () => {
  mocks.send
    .mockResolvedValueOnce({ error: "Please retry shortly." })
    .mockResolvedValueOnce({ bookingRef: "CBT1-ABCD" });
  const Page = BookRoute.options.component!;
  render(<Page />);
  expect(screen.getByRole("heading", { name: "Cross-Border Tours" })).toBeVisible();
  fireEvent.change(screen.getByLabelText("Preferred dates"), { target: { value: "June 2027" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  for (const [label, value] of [
    ["Your name", "Test Traveller"],
    ["Email address", "test@example.com"],
  ])
    fireEvent.change(screen.getByLabelText(label!), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(mocks.send).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "Review your request" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Send booking request" }));
  await screen.findByRole("alert");
  expect(screen.getByText("Test Traveller")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Send booking request" }));
  await screen.findByText("Request received.");
  expect(mocks.send.mock.calls[0]![0].data.request_id).toBe(
    mocks.send.mock.calls[1]![0].data.request_id,
  );
  expect(mocks.send.mock.calls[0]![0].data.trip_code).toBe("CBT1");
  expect(screen.getByText("CBT1-ABCD")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Send booking request" })).toBeNull();
});
it("clears an old booking result when lookup details change", async () => {
  mocks.lookup.mockResolvedValue({
    found: true,
    tripName: "Etosha Wildlife Safari",
    tripCode: "ENP1",
    stage: "Received",
    requestedAt: "2026-10-22T10:00:00Z",
  });
  const Page = LookupRoute.options.component!;
  render(<Page />);
  fireEvent.change(screen.getByLabelText("Booking reference"), { target: { value: "ENP1-ABCD" } });
  fireEvent.change(screen.getByLabelText("Email or phone"), {
    target: { value: "test@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check status" }));
  await waitFor(() => expect(screen.getByText("Etosha Wildlife Safari")).toBeVisible());
  fireEvent.change(screen.getByLabelText("Booking reference"), { target: { value: "ENP1-XXXX" } });
  expect(screen.queryByText("Etosha Wildlife Safari")).toBeNull();
});
