import { getDestination, getStay } from "./pelican";

export type JourneyStop = { destination: string; nights: number; stay?: string };
export function validateJourney(value: unknown): JourneyStop[] {
  if (!Array.isArray(value)) return [];
  const result: JourneyStop[] = [];
  for (const item of value.slice(0, 30)) {
    if (!item || typeof item !== "object" || !getDestination(item.destination)) continue;
    const stay = typeof item.stay === "string" ? getStay(item.stay) : undefined;
    if (stay && stay.destination !== item.destination) continue;
    result.push({
      destination: item.destination,
      nights:
        Number.isInteger(item.nights) && item.nights >= 1 && item.nights <= 90 ? item.nights : 1,
      ...(stay ? { stay: stay.slug } : {}),
    });
  }
  return result;
}
export function parseJourney(value: unknown): JourneyStop[] {
  if (Array.isArray(value)) return validateJourney(value);
  if (typeof value !== "string" || value.length > 10000) return [];
  try {
    return validateJourney(JSON.parse(value));
  } catch {
    return [];
  }
}
export function journeySummary(stops: JourneyStop[]) {
  return stops
    .map(
      (stop, i) =>
        `${i + 1}. ${getDestination(stop.destination)?.name}: ${stop.nights} preferred nights${stop.stay ? `, ${getStay(stop.stay)?.name}` : ""}`,
    )
    .join("\n");
}
export function readJourney(): JourneyStop[] {
  try {
    return parseJourney(localStorage.getItem("pelican-journey"));
  } catch {
    return [];
  }
}
export function saveJourney(stops: JourneyStop[]) {
  try {
    localStorage.setItem("pelican-journey", JSON.stringify(validateJourney(stops)));
    return true;
  } catch {
    return false;
  }
}
