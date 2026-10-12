import { getDestination, getStay } from "./pelican";
import type { JourneyStop } from "./journey";
export {
  destinationPoints,
  propertyLocations,
  stopPoint,
} from "../../supabase/functions/_shared/journey-locations";
import { stopPoint, type MapPoint } from "../../supabase/functions/_shared/journey-locations";
export function stopName(stop: JourneyStop) {
  return (
    (stop.stay ? getStay(stop.stay)?.name : getDestination(stop.destination)?.name) ??
    "Unknown stop"
  );
}
export function straightLineKm(a: MapPoint, b: MapPoint) {
  const rad = (v: number) => (v * Math.PI) / 180;
  const h =
    Math.sin(rad(b[0] - a[0]) / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(Math.min(1, h)), Math.sqrt(Math.max(0, 1 - h)));
}
export function directionsUrl(from: JourneyStop | undefined, to: JourneyStop) {
  const location = (s: JourneyStop) => stopPoint(s)?.join(",") ?? `${stopName(s)}, Namibia`;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", location(to));
  url.searchParams.set("travelmode", "driving");
  if (from) url.searchParams.set("origin", location(from));
  return url.toString();
}
export type RoadRoute = {
  points: MapPoint[];
  legs: { km: number; minutes: number }[];
  provider?: "Mapbox" | "OpenRouteService";
};
export function parseRoadRoute(value: unknown, count: number): RoadRoute {
  const r = value as RoadRoute;
  if (
    !r ||
    (r.provider !== undefined && r.provider !== "Mapbox" && r.provider !== "OpenRouteService") ||
    !Array.isArray(r.points) ||
    r.points.length < 2 ||
    r.points.length > 100000 ||
    !Array.isArray(r.legs) ||
    r.legs.length !== count - 1 ||
    r.points.some(
      (p) =>
        !Array.isArray(p) ||
        p.length !== 2 ||
        !Number.isFinite(p[0]) ||
        !Number.isFinite(p[1]) ||
        Math.abs(p[0]) > 90 ||
        Math.abs(p[1]) > 180,
    ) ||
    r.legs.some(
      (l) => !Number.isFinite(l.km) || !Number.isFinite(l.minutes) || l.km < 0 || l.minutes < 0,
    )
  )
    throw new Error("Invalid route response");
  return r;
}
