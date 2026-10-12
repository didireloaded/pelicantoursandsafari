import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SafariPackageDetails, SafariPackageSummary } from "@/components/approved-safari-package";
import { emptySafariPackage } from "@/lib/safari-package";

// Synthetic amounts are component test fixtures only, never catalogue data.
const details = {
  ...emptySafariPackage(), durationDays: 1,
  days: [{ activities: "Approved activity", overnight: "Approved lodge", transfer: "Discuss pickup" }],
  inclusions: ["Approved transfer"], exclusions: ["International flights"],
  rates: [{ label: "Test season", startsOn: "2099-01-01", endsOn: "2099-12-31", amountNad: 2000, roomNotes: "Two sharing" }],
};
afterEach(() => vi.useRealTimers());
describe("Published safari information display", () => {
  it("shows full rate conditions, itinerary and only fresh indicative currencies", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2099-02-01T12:00:00Z"));
    render(<SafariPackageDetails details={{...details, conversions: [{currency: "USD", perNad: 0.05, checkedOn: "2099-02-01", sourceUrl: "https://example.com/rate"}]}} sourceUrl="https://example.com/approved" updatedAt="2099-02-01" />);
    expect(screen.getByText("Approved activity")).toBeInTheDocument();
    expect(screen.getByText("Overnight: Approved lodge")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Display currency/), {target:{value:"USD"}});
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText(/Indicative conversion only; quotes remain in NAD/)).toBeInTheDocument();
    expect(screen.getByText(/NAD 2,000 base price/)).toBeInTheDocument();
  });
  it("never advertises an expired rate or stale currency conversion", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2100-02-01T12:00:00Z"));
    render(<><SafariPackageSummary details={details}/><SafariPackageDetails details={{...details, conversions:[{currency:"EUR",perNad:0.04,checkedOn:"2099-01-01",sourceUrl:"https://example.com/rate"}]}} sourceUrl="https://example.com/approved" updatedAt="2099-02-01"/></>);
    expect(screen.queryByText(/From NAD/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Display currency/)).not.toBeInTheDocument();
    expect(screen.queryByText("Seasonal pricing")).not.toBeInTheDocument();
  });
});
