import { describe, expect, it } from "vitest";
import {
  activeConversions,
  displayPackageAmount,
  emptySafariPackage,
  readApprovedPackages,
  safariPackageSchema,
  startingRate,
} from "@/lib/safari-package";

const details = {
  ...emptySafariPackage(),
  durationDays: 1,
  days: [{ activities: "Verified activity", overnight: "", transfer: "" }],
  rates: [
    {
      label: "Season",
      startsOn: "2026-10-01",
      endsOn: "2026-11-01",
      amountNad: 1234.56,
      roomNotes: "Twin sharing",
    },
  ],
  conversions: [
    {
      currency: "USD" as const,
      perNad: 0.052,
      checkedOn: "2026-10-12",
      sourceUrl: "https://example.com/rates",
    },
  ],
};
const row = {
  approved: true,
  safari_slug: "big-five-etosha",
  package_details: details,
  source_url: "https://example.com/tour",
  updated_at: "2026-10-12T00:00:00Z",
};

describe("Verified safari facts", () => {
  it("never publishes drafts, unknown safaris, malformed JSON or unsafe sources", () => {
    expect(
      readApprovedPackages([
        { ...row, approved: false },
        { ...row, safari_slug: "invented-tour" },
        { ...row, package_details: { ...details, paymentTerms: "50%" } },
        { ...row, source_url: "javascript:alert(1)" },
      ]),
    ).toEqual({});
    expect(readApprovedPackages([row])[row.safari_slug]?.details).toEqual(details);
  });
  it("requires duration to agree with activities and rejects impossible dates and prices", () => {
    expect(safariPackageSchema.safeParse({ ...details, durationDays: 2 }).success).toBe(false);
    expect(
      safariPackageSchema.safeParse({
        ...details,
        rates: [{ ...details.rates[0], startsOn: "2026-02-30" }],
      }).success,
    ).toBe(false);
    expect(
      safariPackageSchema.safeParse({ ...details, rates: [{ ...details.rates[0], amountNad: -1 }] })
        .success,
    ).toBe(false);
    expect(
      safariPackageSchema.safeParse({
        ...details,
        rates: [{ ...details.rates[0], endsOn: "2026-09-01" }],
      }).success,
    ).toBe(false);
  });
  it("shows future or current travel rates, never expired starting prices", () => {
    expect(startingRate(details, "2026-10-12")?.amountNad).toBe(1234.56);
    expect(startingRate(details, "2026-11-02")).toBeUndefined();
  });
  it("converts with decimal rounding only using fresh sourced rates and falls back to NAD", () => {
    expect(displayPackageAmount(1234.56, "USD", details, "2026-10-12")).toBe("$64.20");
    expect(activeConversions(details, "2026-10-19")).toHaveLength(1);
    expect(activeConversions(details, "2026-10-20")).toHaveLength(0);
    expect(activeConversions(details, "2026-10-11")).toHaveLength(0);
    expect(displayPackageAmount(1234.56, "USD", details, "2026-10-20")).toBe("NAD 1,234.56");
    expect(displayPackageAmount(1234.56, "EUR", details, "2026-10-12")).toBe("NAD 1,234.56");
  });
  it("rejects nonfinite, duplicate or unsourced conversions", () => {
    expect(
      safariPackageSchema.safeParse({
        ...details,
        conversions: [{ ...details.conversions[0], perNad: Infinity }],
      }).success,
    ).toBe(false);
    expect(
      safariPackageSchema.safeParse({
        ...details,
        conversions: [details.conversions[0], details.conversions[0]],
      }).success,
    ).toBe(false);
    expect(
      safariPackageSchema.safeParse({
        ...details,
        conversions: [{ ...details.conversions[0], sourceUrl: "http://example.com" }],
      }).success,
    ).toBe(false);
  });
});
