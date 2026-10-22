import { chooseOption } from "./select-option";
vi.mock("@/lib/site-content-api", () => ({
  usePublishedContent: () => ({ data: [], isPending: false, isError: false }),
}));
import type { ComponentType, ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: ComponentType }) => ({
    options,
    useSearch: () => ({}),
  }),
}));
vi.mock("@/components/site", () => ({
  PageHero: () => <div />,
  Section: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  meta: () => [],
}));
vi.mock("@/components/safari-planning", () => ({
  SafariPlanningSteps: () => <h2>How planning works</h2>,
  PelicanContactInfo: () => <p>Pelican contact details</p>,
  ApprovedTravelTrust: () => null,
}));
vi.mock("@/lib/enquiry-submit.functions", () => ({ submitTripEnquiry: mocks.submit }));
import { Route } from "@/routes/tailor-made";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function openBrief() {
  const Component = Route.options.component as ComponentType;
  render(<Component />);
}
it("blocks review-step jumps with invalid traveller counts and focuses the failed step", () => {
  openBrief();
  fireEvent.click(screen.getByRole("button", { name: "2. Dates & travellers" }));
  fireEvent.change(screen.getByLabelText("Adults"), { target: { value: "1.5" } });
  fireEvent.click(screen.getByRole("button", { name: "4. Review your brief" }));
  expect(screen.getByRole("alert")).toHaveTextContent("whole number of adults");
  expect(screen.getByRole("heading", { name: "Dates & travellers" })).toHaveFocus();
  expect(screen.queryByRole("button", { name: "Send brief to Pelican" })).toBeNull();
  expect(mocks.submit).not.toHaveBeenCalled();
});
it("retains the editable budget and safari experience in the reviewed brief", () => {
  openBrief();
  fireEvent.click(screen.getByRole("button", { name: "3. Travel preferences" }));
  fireEvent.change(screen.getByLabelText(/Budget per person/), { target: { value: "25000" } });
  chooseOption("Safari experience", "Been on safari before");
  fireEvent.click(screen.getByRole("button", { name: "4. Review your brief" }));
  expect(screen.getByText("NAD 25000 per person (subject to quote)")).toBeInTheDocument();
  expect(screen.getByText("Been on safari before")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Send brief to Pelican" }));
  expect(mocks.submit).not.toHaveBeenCalled();
  expect(
    screen.getByText("Please add your name and an email or phone number."),
  ).toBeInTheDocument();
});
