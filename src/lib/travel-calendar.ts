import { getDestination, travelGuidance } from "@/lib/pelican";

export const travelMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function calendarGuidance(slug: string, month: number) {
  const destination = getDestination(slug);
  if (!destination || !Number.isInteger(month) || month < 1 || month > 12) return undefined;
  const climate = travelGuidance.calendar;
  if (destination.country !== "Namibia") {
    const regional = travelGuidance.seasons[3]!;
    return {
      destination,
      heading: `${travelMonths[month - 1]} in ${destination.name}`,
      notes: [
        regional.body,
        "Month-specific conditions for this destination need confirmation with Pelican; Namibia’s seasonal ranges do not apply here.",
      ],
      source: regional.source,
      checked: travelGuidance.checked,
    };
  }
  const coastal = ["swakopmund-walvis-bay", "skeleton-coast"].includes(slug);
  const notes = [
    coastal
      ? climate.coast
      : climate.summerMonths.includes(month)
        ? climate.summer
        : climate.winter,
  ];
  if (!coastal)
    notes.push(
      climate.mainRainMonths.includes(month)
        ? climate.mainRain
        : climate.shortRainMonths.includes(month)
          ? climate.shortRain
          : climate.outsideRain,
    );
  if (["etosha", "kavango-zambezi"].includes(slug)) notes.push(climate.wildlife);
  return {
    destination,
    heading: `${travelMonths[month - 1]} in ${destination.name}`,
    notes,
    source: climate.source,
    checked: climate.checked,
  };
}
