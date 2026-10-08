import { describe, expect, it } from "vitest";
import { parseJourney, validateJourney, journeySummary } from "@/lib/journey";
describe("Journey preferences", () => {
  it("rejects malformed data, unknown places and mismatched accommodation", () => {
    expect(parseJourney("not json")).toEqual([]);
    expect(
      validateJourney([
        { destination: "unknown" },
        { destination: "windhoek", stay: "okaukuejo-resort", nights: 2 },
      ]),
    ).toEqual([]);
  });
  it("keeps only preference fields and validates nights", () => {
    expect(
      validateJourney([
        { destination: "etosha", stay: "okaukuejo-resort", nights: -1, email: "private" },
      ]),
    ).toEqual([{ destination: "etosha", stay: "okaukuejo-resort", nights: 1 }]);
  });
  it("includes ordered accommodation and nights in outbound briefs", () => {
    expect(journeySummary([{ destination: "etosha", stay: "mokuti-etosha", nights: 3 }])).toContain(
      "Mokuti Etosha",
    );
    expect(journeySummary([{ destination: "etosha", nights: 3 }])).toContain("3 preferred nights");
  });
});
