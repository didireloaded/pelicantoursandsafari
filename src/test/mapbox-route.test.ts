// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { mapboxRoute } from "../../supabase/functions/_shared/mapbox-route";
import { parseRoadRoute } from "../lib/journey-geography";
import type { MapPoint } from "../../supabase/functions/_shared/journey-locations";
function response(url: URL) {
  const coordinates = url.pathname
    .split("/")
    .at(-1)!
    .split(";")
    .map((s) => s.split(",").map(Number));
  return new Response(
    JSON.stringify({
      code: "Ok",
      routes: [
        {
          geometry: { type: "LineString", coordinates },
          legs: coordinates.slice(1).map(() => ({ distance: 12000, duration: 600 })),
        },
      ],
    }),
  );
}
describe("Mapbox journey routes", () => {
  it("preserves waypoint order, normalizes longitude/latitude and returns existing client contract", async () => {
    const fetcher = vi.fn(async (input: unknown) => response(input as URL));
    const route = await mapboxRoute(
      [
        [-22, 17],
        [-18, 16],
      ],
      "test-token",
      fetcher,
    );
    expect(route.points).toEqual([
      [-22, 17],
      [-18, 16],
    ]);
    expect(route.legs).toEqual([{ km: 12, minutes: 10 }]);
    expect(route.provider).toBe("Mapbox");
    expect(parseRoadRoute(route, 2)).toEqual(route);
    const url = fetcher.mock.calls[0]![0] as URL;
    expect(url.searchParams.get("geometries")).toBe("geojson");
    expect(url.searchParams.get("access_token")).toBe("test-token");
  });
  it("supports 30 stops with two bounded requests and no duplicate legs", async () => {
    const points: MapPoint[] = Array.from({ length: 30 }, (_, i) => [-22 + i / 100, 17]);
    const fetcher = vi.fn(async (input: unknown) => response(input as URL));
    const route = await mapboxRoute(points, "test-token", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(route.points).toEqual(points);
    expect(route.legs).toHaveLength(29);
    expect(parseRoadRoute(route, 30)).toEqual(route);
  });
  it("refuses provider errors, malformed geometry and nonfinite estimates", async () => {
    const points: MapPoint[] = [
      [-22, 17],
      [-18, 16],
    ];
    for (const data of [
      { code: "NoRoute", routes: [] },
      {
        code: "Ok",
        routes: [
          {
            geometry: {
              type: "LineString",
              coordinates: [
                [999, 17],
                [16, -18],
              ],
            },
            legs: [{ distance: 1, duration: 1 }],
          },
        ],
      },
      {
        code: "Ok",
        routes: [
          {
            geometry: {
              type: "LineString",
              coordinates: [
                [17, -22],
                [16, -18],
              ],
            },
            legs: [{ distance: -1, duration: 1 }],
          },
        ],
      },
    ])
      await expect(
        mapboxRoute(
          points,
          "test-token",
          vi.fn(async () => new Response(JSON.stringify(data))),
        ),
      ).rejects.toThrow();
    await expect(
      mapboxRoute(
        points,
        "test-token",
        vi.fn(async () => new Response("", { status: 401 })),
      ),
    ).rejects.toThrow("provider unavailable");
    await expect(
      mapboxRoute(
        points,
        "test-token",
        vi.fn(async () => {
          throw new Error("offline");
        }),
      ),
    ).rejects.toThrow("offline");
  });
  it("does not display a discontinuous batched route or return a partial success", async () => {
    const points: MapPoint[] = Array.from({ length: 30 }, (_, i) => [-22 + i / 100, 17]);
    let calls = 0;
    const fetcher = vi.fn(async (input: unknown) => {
      const data = await response(input as URL).json();
      if (calls++) data.routes[0].geometry.coordinates[0][0] += 1;
      return new Response(JSON.stringify(data));
    });
    await expect(mapboxRoute(points, "test-token", fetcher)).rejects.toThrow("do not connect");
  });
});
