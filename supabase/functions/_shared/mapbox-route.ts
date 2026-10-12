import type { MapPoint } from "./journey-locations.ts";

type RoadRoute = {
  points: MapPoint[];
  legs: { km: number; minutes: number }[];
  provider: "Mapbox";
};
function parseRoute(value: unknown, count: number): RoadRoute {
  const result = value as {
    code?: string;
    routes?: {
      geometry?: { type?: string; coordinates?: unknown[] };
      legs?: { distance?: unknown; duration?: unknown }[];
    }[];
  } | null;
  const route = result?.routes?.[0];
  const coordinates = route?.geometry?.coordinates;
  if (
    result?.code !== "Ok" ||
    route?.geometry?.type !== "LineString" ||
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    coordinates.length > 100000 ||
    !Array.isArray(route.legs) ||
    route.legs.length !== count - 1
  )
    throw new Error("No driving route available");
  const points: MapPoint[] = coordinates.map((value) => {
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      !Number.isFinite(value[0]) ||
      !Number.isFinite(value[1]) ||
      Math.abs(value[0]) > 180 ||
      Math.abs(value[1]) > 90
    )
      throw new Error("Invalid driving route");
    return [value[1], value[0]];
  });
  const legs = route.legs.map((leg) => {
    if (
      typeof leg.distance !== "number" ||
      typeof leg.duration !== "number" ||
      !Number.isFinite(leg.distance) ||
      !Number.isFinite(leg.duration) ||
      leg.distance < 0 ||
      leg.duration < 0
    )
      throw new Error("Invalid driving estimate");
    return { km: leg.distance / 1000, minutes: leg.duration / 60 };
  });
  return { points, legs, provider: "Mapbox" };
}

// Catalogue coordinates only. Overlapping batches preserve the existing 30-stop
// journey limit while staying within Mapbox's 25-waypoint limit per request.
export async function mapboxRoute(
  points: MapPoint[],
  token: string,
  request: typeof fetch = fetch,
): Promise<RoadRoute> {
  if (!token || points.length < 2 || points.length > 30) throw new Error("Routing unavailable");
  const result: RoadRoute = { points: [], legs: [], provider: "Mapbox" };
  const signal = AbortSignal.timeout(15000);
  for (let start = 0; start < points.length - 1; start += 24) {
    const batch = points.slice(start, start + 25);
    const coordinates = batch.map((point) => `${point[1]},${point[0]}`).join(";");
    const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`);
    url.searchParams.set("access_token", token);
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");
    url.searchParams.set("steps", "false");
    const response = await request(url, { signal });
    if (!response.ok) throw new Error("Routing provider unavailable");
    const route = parseRoute(await response.json(), batch.length);
    if (result.points.length) {
      const previous = result.points.at(-1)!;
      const next = route.points[0]!;
      if (Math.abs(previous[0] - next[0]) > 0.00001 || Math.abs(previous[1] - next[1]) > 0.00001)
        throw new Error("Driving route segments do not connect");
    }
    result.points.push(...(result.points.length ? route.points.slice(1) : route.points));
    result.legs.push(...route.legs);
  }
  if (result.points.length > 100000) throw new Error("Driving route too large");
  return result;
}
