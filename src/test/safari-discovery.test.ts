import { describe, expect, it } from "vitest";
import { findSafaris, planningSearch } from "@/lib/safari-discovery";

describe("Safari planning context", () => {
  it("accepts a known safari and removes invalid or duplicate destinations", () => {
    expect(
      planningSearch({ safari: "big-five-etosha", destinations: "etosha,invalid,etosha,windhoek" }),
    ).toEqual({ safari: "big-five-etosha", destinations: "etosha,windhoek" });
  });
  it("leaves plain planner links valid and rejects malformed context", () => {
    expect(planningSearch({})).toEqual({});
    expect(planningSearch({ safari: "unknown", destinations: ["etosha"] })).toEqual({});
  });
  it("combines country, place and experience filters", () => {
    expect(findSafaris("Namibia", "windhoek", "Culture").map((s) => s.slug)).toEqual([
      "windhoek-city-tour",
    ]);
    expect(findSafaris("Zimbabwe", "windhoek", "Wildlife")).toEqual([]);
  });
});
