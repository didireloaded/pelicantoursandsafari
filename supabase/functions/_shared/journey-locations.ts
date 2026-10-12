export type MapPoint = [number, number]; // latitude, longitude
export const destinationPoints: Record<string, MapPoint> = {
  etosha: [-18.9, 16.4],
  "sossusvlei-deadvlei": [-24.73, 15.29],
  "swakopmund-walvis-bay": [-22.68, 14.53],
  spitzkoppe: [-21.83, 15.2],
  "skeleton-coast": [-20.4, 13.2],
  "kavango-zambezi": [-17.8, 22.3],
  windhoek: [-22.57, 17.08],
  botswana: [-22.3, 24.7],
  chobe: [-18.4, 24.2],
  zimbabwe: [-19, 29.15],
  "victoria-falls": [-17.93, 25.86],
};
export const propertyLocations: Record<
  string,
  { point: MapPoint; destination: string; source: string; checked: string }
> = {
  "mokuti-etosha": {
    point: [-(18 + 48 / 60 + 43.48 / 3600), 17 + 2 / 60 + 47.62 / 3600],
    destination: "etosha",
    source:
      "https://cdn.prod.website-files.com/64900f59340fdc6f79fd95e7/69382081ec3b6144ec3aa532_Mokuti_Fact%20Sheet.pdf",
    checked: "2026-10-12",
  },
  "the-desert-grace": {
    point: [-24.17389, 15.90139],
    destination: "sossusvlei-deadvlei",
    source: "https://gondwana-collection.com/accommodation/desert-grace",
    checked: "2026-10-12",
  },
  "okaukuejo-resort": {
    point: [-19.1787488, 15.9189879],
    destination: "etosha",
    source: "https://www.nwr.com.na/resorts/okaukuejo-resort/",
    checked: "2026-10-12",
  },
  "strand-hotel-swakopmund": {
    point: [-(22 + 40 / 60 + 32.29 / 3600), 14 + 31 / 60 + 18.75 / 3600],
    destination: "swakopmund-walvis-bay",
    source:
      "https://stwetuproduction.blob.core.windows.net/azure-blob-resources-wetu-production/Resources/1747/Strand_Hotel_Swakopmund_Brochure_-_HighRes.pdf",
    checked: "2026-10-12",
  },
};
export type RouteStop = { destination: string; stay?: string };
export function stopPoint(stop: RouteStop): MapPoint | undefined {
  // Never substitute a destination centre for an unverified accommodation location.
  return stop.stay ? propertyLocations[stop.stay]?.point : destinationPoints[stop.destination];
}
export function routeCoordinates(value: unknown): MapPoint[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 30)
    throw new Error("Choose 2–30 stops");
  return value.map((stop) => {
    if (
      !stop ||
      typeof stop !== "object" ||
      typeof stop.destination !== "string" ||
      !Object.hasOwn(destinationPoints, stop.destination)
    )
      throw new Error("Unknown destination");
    if (
      stop.stay !== undefined &&
      (typeof stop.stay !== "string" ||
        !Object.hasOwn(propertyLocations, stop.stay) ||
        propertyLocations[stop.stay]?.destination !== stop.destination)
    )
      throw new Error("Property location unavailable");
    const point = stopPoint(stop);
    if (!point) throw new Error("Location unavailable");
    return point;
  });
}
