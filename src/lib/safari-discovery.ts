import { getDestination, safariInterests, safaris } from "@/lib/pelican";

export function findSafaris(country: string, destination: string, interest: string) {
  return safaris.filter((safari) =>
    (!country || safari.destinations.some((slug) => getDestination(slug)?.country === country)) &&
    (!destination || safari.destinations.includes(destination)) &&
    (!interest || safariInterests[safari.slug]?.includes(interest)),
  );
}

export type PlanningSearch = { safari?: string; destinations?: string };

export function planningSearch(search: Record<string, unknown>): PlanningSearch {
  const out: PlanningSearch = {};
  if (typeof search["safari"] === "string") out.safari = search["safari"];
  if (typeof search["destinations"] === "string") out.destinations = search["destinations"];
  return out;
}