import { chooseOption } from "./select-option";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    hash,
    search,
    children,
    ...props
  }: {
    to: string;
    hash?: string;
    search?: { destinations: string };
    children: ReactNode;
  }) => (
    <a
      href={`${to}${search ? `?destinations=${search.destinations}` : ""}${hash ? `#${hash}` : ""}`}
      {...props}
    >
      {children}
    </a>
  ),
}));
vi.mock("@/components/site", () => ({
  Section: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  Photo: ({ name }: { name: string }) => <img src={name} alt="" />,
}));
import { TravelCalendar } from "@/components/travel-calendar";
import { JourneyPanels } from "@/components/journey-panels";
afterEach(cleanup);

it("keeps every panel action visible and makes focus select its background", () => {
  const { container } = render(<JourneyPanels />);
  const calendar = screen.getByRole("link", { name: /When to visit/ });
  expect(calendar).toHaveAttribute("href", "/travel-guide#travel-calendar");
  expect(screen.getByRole("link", { name: /Plan my journey/ })).toHaveAttribute("href", "/journey");
  fireEvent.focus(calendar);
  expect(container.querySelectorAll(".journey-panel-background")[2]).toHaveClass("opacity-100");
  expect(screen.getByText("Explore the calendar")).toBeVisible();
});
it("updates seasonal guidance and transfers only the selected destination to the brief", () => {
  render(<TravelCalendar />);
  expect(screen.queryByRole("link", { name: /Plan a journey/ })).toBeNull();
  chooseOption("Travel month", "September");
  expect(screen.getByRole("status")).toHaveTextContent("September in Etosha National Park");
  expect(screen.getByText(/short rainy season/)).toBeVisible();
  chooseOption("Calendar destination", "Chobe");
  expect(screen.getByText(/Month-specific conditions/)).toBeVisible();
  expect(screen.getByRole("link", { name: /Plan a journey/ })).toHaveAttribute(
    "href",
    "/tailor-made?destinations=chobe",
  );
  chooseOption("Travel month", "Choose a month");
  expect(screen.queryByRole("link", { name: /Plan a journey/ })).toBeNull();
});
