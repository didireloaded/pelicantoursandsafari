import { getDestination, getSafari, safariInterests, safaris } from "@/lib/pelican";
import { parseShortlist } from "./shortlist";
import { parseJourney } from "./journey";

export function findSafaris(country: string, destination: string, interest: string) {
  return safaris.filter(
    (safari) =>
      (!country || safari.destinations.some((slug) => getDestination(slug)?.country === country)) &&
      (!destination || safari.destinations.includes(destination)) &&
      (!interest || safariInterests[safari.slug]?.includes(interest)),
  );
}

export type PlanningSearch = {
  package?: string;
  safari?: string;
  destinations?: string;
  journey?: string;
  preferences?: string;
  shortlist?: string;
};

export function planningSearch(search: Record<string, unknown>): PlanningSearch {
  const out: PlanningSearch = {};
  if (typeof search["package"] === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(search["package"])) out.package = search["package"];
  const shortlist = parseShortlist(search["shortlist"]);
  if (shortlist.length) out.shortlist = JSON.stringify(shortlist);
  if (typeof search["preferences"] === "string" && search["preferences"].length < 1500) {
    try {
      const p = JSON.parse(search["preferences"]);
      const days =
        typeof p.days === "string" && /^([1-9]|[1-8][0-9]|90)$/.test(p.days) ? p.days : "";
      const budget =
        typeof p.budget === "string" &&
        /^\d{1,8}$/.test(p.budget) &&
        Number(p.budget) > 0 &&
        Number(p.budget) <= 10000000
          ? p.budget
          : "";
      const style = ["Open to suggestions", "Private guided", "Small group"].includes(p.style)
        ? p.style
        : "Open to suggestions";
      const interests = Array.isArray(p.interests)
        ? [
            ...new Set(
              p.interests.filter(
                (x: unknown) =>
                  typeof x === "string" && Object.values(safariInterests).flat().includes(x),
              ),
            ),
          ]
        : [];
      out.preferences = JSON.stringify({ days, budget, style, interests });
    } catch {
      /* Invalid shared preferences are ignored. */
    }
  }
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

export type DiscoverySearch = { country?: string; destination?: string; interest?: string };

/** Shareable catalogue filters accept only known destinations and experience labels. */
export function discoverySearch(search: Record<string, unknown>): DiscoverySearch {
  const out: DiscoverySearch = {};
  if (typeof search["country"] === "string" && ["Namibia", "Botswana", "Zimbabwe"].includes(search["country"])) out.country = search["country"];
  if (typeof search["destination"] === "string" && getDestination(search["destination"])) out.destination = search["destination"];
  if (typeof search["interest"] === "string" && Object.values(safariInterests).flat().includes(search["interest"])) out.interest = search["interest"];
  return out;
}
