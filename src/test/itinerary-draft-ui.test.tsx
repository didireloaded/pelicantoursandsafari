import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({ invoke: vi.fn(), rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: mocks.invoke },
    rpc: mocks.rpc,
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }),
      }),
    }),
  },
}));
import { ItineraryDraft } from "@/components/itinerary-draft";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("previews an editable itinerary quote using only staff-entered money and terms", async () => {
  const quote = {
    currency: "NAD",
    total: "4200",
    valid_until: "2026-12-01",
    terms: "Verified deposit: NAD 1000, payable by EFT.",
    accommodation: "Verified room allocation",
    inclusions: "Guiding",
    exclusions: "Flights",
  };
  const onApply = vi.fn();
  mocks.invoke.mockResolvedValue({
    data: { itinerary: "Day 1\nWindhoek city visit\n\nDay 2\nEtosha game drive" },
    error: null,
  });
  render(<ItineraryDraft enquiryId={null} quote={quote} onApply={onApply} />);
  fireEvent.click(screen.getByText("Draft itinerary quote with Lovable AI"));
  fireEvent.change(screen.getByLabelText("Safari Brief trip preferences"), {
    target: { value: "Two days of wildlife and culture at a relaxed pace." },
  });
  fireEvent.change(screen.getByLabelText("Selected tour details"), {
    target: { value: "Windhoek city visit\nEtosha game drive" },
  });
  fireEvent.change(screen.getByLabelText("Itinerary days"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Generate itinerary quote draft" }));
  await screen.findByText("Quote draft — staff review required");
  expect(screen.getByText("Total supplied by staff: NAD 4200")).toBeInTheDocument();
  expect(screen.getByText(quote.terms)).toBeInTheDocument();
  expect(screen.getByText(quote.accommodation)).toBeInTheDocument();
  expect(mocks.invoke).toHaveBeenCalledWith("draft-itinerary", {
    body: {
      brief: "Two days of wildlife and culture at a relaxed pace.",
      days: 2,
      details: ["Windhoek city visit", "Etosha game drive"],
    },
  });
  expect(onApply).not.toHaveBeenCalled();
  expect(mocks.rpc).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Use itinerary in proposal" }));
  expect(onApply).toHaveBeenCalledWith("Day 1\nWindhoek city visit\n\nDay 2\nEtosha game drive");
  expect(screen.getByText(quote.terms)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Selected tour details"), {
    target: { value: "Changed tour detail" },
  });
  expect(screen.queryByText("Quote draft — staff review required")).not.toBeInTheDocument();
});
it("shows actionable gateway errors and does not apply an unsuccessful draft", async () => {
  mocks.invoke.mockResolvedValue({
    data: null,
    error: {
      context: {
        json: async () => ({
          error: "Your Lovable workspace needs AI credits to generate this draft.",
        }),
      },
    },
  });
  const apply = vi.fn();
  render(
    <ItineraryDraft
      enquiryId={null}
      quote={{
        currency: "NAD",
        total: "",
        valid_until: "",
        terms: "",
        accommodation: "",
        inclusions: "",
        exclusions: "",
      }}
      onApply={apply}
    />,
  );
  fireEvent.click(screen.getByText("Draft itinerary quote with Lovable AI"));
  fireEvent.change(screen.getByLabelText("Safari Brief trip preferences"), {
    target: { value: "A relaxed city tour in Windhoek." },
  });
  fireEvent.change(screen.getByLabelText("Selected tour details"), {
    target: { value: "Windhoek city visit" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Generate itinerary quote draft" }));
  await waitFor(() =>
    expect(
      screen.getByText("Your Lovable workspace needs AI credits to generate this draft."),
    ).toBeInTheDocument(),
  );
  expect(apply).not.toHaveBeenCalled();
});
