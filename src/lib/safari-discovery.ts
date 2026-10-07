import { getDestination, safariInterests, safaris } from "@/lib/pelican";

export function findSafaris(country: string, destination: string, interest: string) {
  return safaris.filter((safari) =>
    (!country || safari.destinations.some((slug) => getDestination(slug)?.country === country)) &&
    (!destination || safari.destinations.includes(destination)) &&
    (!interest || safariInterests[safari.slug]?.includes(interest)),
  );
}

export function planningSearch(search: Record<string, unknown>) {
  return {
    safari: typeof search.safari === "string" ? search.safari : undefined,
    destinations: typeof search.destinations === "string" ? search.destinations : undefined,
  };
}