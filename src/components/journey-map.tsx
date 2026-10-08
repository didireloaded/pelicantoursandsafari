import { useEffect, useRef } from "react";
import { destinations } from "@/lib/pelican";
import type { JourneyStop } from "@/lib/journey";
import "leaflet/dist/leaflet.css";

// Approximate destination overview points, not property locations or driving routes.
const points: Record<string, [number, number]> = {
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
export function JourneyMap({
  stops,
  onSelect,
}: {
  stops: JourneyStop[];
  onSelect: (slug: string) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    import("leaflet").then((L) => {
      if (disposed || !element.current) return;
      const map = L.map(element.current).setView([-21, 20], 5);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 12,
      }).addTo(map);
      destinations.forEach((destination) => {
        const point = points[destination.slug];
        if (!point) return;
        const sequence = stops.findIndex((s) => s.destination === destination.slug);
        const marker = L.marker(point, {
          icon: L.divIcon({
            html: `<span style="display:block;border-radius:50%;background:${sequence >= 0 ? "#185846" : "#af602a"};color:white;text-align:center;width:28px;height:28px;line-height:28px">${sequence >= 0 ? sequence + 1 : "+"}</span>`,
            className: "",
            iconSize: [28, 28],
          }),
          title: destination.name,
          keyboard: true,
        });
        marker
          .bindTooltip(destination.name)
          .on("click", () => onSelect(destination.slug))
          .addTo(map);
        marker.getElement()?.setAttribute("aria-label", `Explore ${destination.name}`);
      });
      const route = stops
        .map((s) => points[s.destination])
        .filter((p): p is [number, number] => !!p);
      if (route.length > 1) L.polyline(route, { color: "#185846", dashArray: "6 8" }).addTo(map);
      cleanup = () => map.remove();
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [stops, onSelect]);
  return (
    <div>
      <div
        ref={element}
        className="relative z-0 h-[420px] w-full border border-border"
        role="region"
        aria-label="Interactive destination map"
      />
      <p className="mt-3 text-xs text-muted-foreground">
        Approximate destination points. Dashed lines show your preferred stop order, not roads or
        verified driving routes. Map tiles are provided by OpenStreetMap.
      </p>
    </div>
  );
}
