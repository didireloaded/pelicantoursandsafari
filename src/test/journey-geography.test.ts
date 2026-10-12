import { describe, expect, it } from "vitest";
import { directionsUrl, parseRoadRoute, stopPoint, straightLineKm } from "@/lib/journey-geography";
import { routeCoordinates } from "../../supabase/functions/_shared/journey-locations";
describe("Journey geography", () => {
  it("routes stays at property points and refuses unknown or mismatched locations", () => {
    expect(stopPoint({ destination: "etosha", stay: "mokuti-etosha" })).not.toEqual(
      stopPoint({ destination: "etosha" }),
    );
    expect(() =>
      routeCoordinates([
        { destination: "etosha", stay: "the-desert-grace" },
        { destination: "windhoek" },
      ]),
    ).toThrow();
    expect(() =>
      routeCoordinates([{ destination: "__proto__" }, { destination: "windhoek" }]),
    ).toThrow();
    expect(() =>
      routeCoordinates([{ destination: "etosha", stay: "unknown" }, { destination: "windhoek" }]),
    ).toThrow();
  });
  it("calculates straight-line km and encodes explicit driving directions", () => {
    expect(straightLineKm([0, 0], [0, 1])).toBeCloseTo(111.195, 2);
    expect(straightLineKm([-18, 17], [-18, 17])).toBe(0);
    const url = new URL(
      directionsUrl(
        { destination: "windhoek", nights: 1 },
        { destination: "etosha", stay: "okaukuejo-resort", nights: 2 },
      ),
    );
    expect(url.searchParams.get("travelmode")).toBe("driving");
    expect(url.searchParams.get("destination")).toBe("-19.1787488,15.9189879");
  });
  it("rejects incomplete and malformed road estimates", () => {
    const valid = {
      points: [
        [-18, 17],
        [-22, 17],
      ],
      legs: [{ km: 400, minutes: 300 }],
    };
    expect(parseRoadRoute(valid, 2)).toEqual(valid);
    expect(() => parseRoadRoute(valid, 3)).toThrow();
    expect(() => parseRoadRoute({ ...valid, legs: [{ km: -1, minutes: 3 }] }, 2)).toThrow();
    expect(() =>
      parseRoadRoute(
        {
          ...valid,
          points: [
            [999, 17],
            [0, 1],
          ],
        },
        2,
      ),
    ).toThrow();
  });
});
