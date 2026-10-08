import { getDestination, getSafari, safariInterests, safaris } from "@/lib/pelican";
import { parseJourney } from "./journey";

export function findSafaris(country: string, destination: string, interest: string) {
  return safaris.filter(
    (safari) =>
      (!country || safari.destinations.some((slug) => getDestination(slug)?.country === country)) &&
      (!destination || safari.destinations.includes(destination)) &&
      (!interest || safariInterests[safari.slug]?.includes(interest)),
  );
}

export type PlanningSearch = { safari?: string; destinations?: string; journey?: string };

export function planningSearch(search: Record<string, unknown>): PlanningSearch {
  const out: PlanningSearch = {};
  const journey = parseJourney(search["journey"]);
  if (journey.length) out.journey = JSON.stringify(journey);
  if (typeof search["safari"] === "string" && getSafari(search["safari"]))
    out.safari = search["safari"];
  if (typeof search["destinations"] === "string") {
    const places = [
      ...new Set(search["destinations"].split(",").filter((slug) => getDestination(slug))),
    ];
    if (places.length) out.destinations = places.join(",");
  }
  return out;
}
