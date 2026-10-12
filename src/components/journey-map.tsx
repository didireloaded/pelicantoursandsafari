import { useEffect, useRef } from "react";
import { destinations } from "@/lib/pelican";
import type { JourneyStop } from "@/lib/journey";
import "leaflet/dist/leaflet.css";

import {
  destinationPoints as points,
  propertyLocations,
  stopPoint,
  type RoadRoute,
} from "@/lib/journey-geography";
import { stays } from "@/lib/pelican";
export function JourneyMap({
  stops,
  onSelect,
  roadRoute,
  confirmed = false,
}: {
  stops: JourneyStop[];
  onSelect: (slug: string) => void;
  roadRoute?: RoadRoute | undefined;
  confirmed?: boolean;
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
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' +
          (roadRoute?.provider === "Mapbox"
            ? ' | Routing &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
            : ""),
        maxZoom: 12,
      }).addTo(map);
      destinations.forEach((destination) => {
        const point = points[destination.slug];
        if (!point) return;
        const sequence = stops.findIndex((s) => !s.stay && s.destination === destination.slug);
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
      stays.forEach((stay) => {
        const location = propertyLocations[stay.slug];
        if (!location) return;
        const sequence = stops.findIndex((s) => s.stay === stay.slug);
        const marker = L.marker(location.point, {
          icon: L.divIcon({
            html: `<span style="display:block;background:#185846;color:white;border:2px solid white;border-radius:4px;text-align:center;width:30px;height:30px;line-height:26px">${sequence >= 0 ? sequence + 1 : "⌂"}</span>`,
            className: "",
            iconSize: [30, 30],
          }),
          title: stay.name,
          keyboard: true,
        }).addTo(map);
        const content = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = stay.name;
        content.append(name);
        const state = document.createElement("p");
        state.textContent =
          sequence >= 0
            ? confirmed
              ? "Confirmed stay"
              : "Selected preference — not booked"
            : "Accommodation";
        content.append(state);
        const link = document.createElement("a");
        link.href = `/stay/${stay.slug}`;
        link.textContent = "View accommodation";
        content.append(link);
        marker.bindPopup(content, { maxWidth: 240 }).bindTooltip(stay.name);
        marker.getElement()?.setAttribute("aria-label", `View ${stay.name}`);
      });
      const route = stops.map(stopPoint).filter((p): p is [number, number] => !!p);
      if (roadRoute) L.polyline(roadRoute.points, { color: "#185846" }).addTo(map);
      else
        stops.slice(1).forEach((stop, i) => {
          const a = stops[i] && stopPoint(stops[i]);
          const b = stopPoint(stop);
          if (a && b) L.polyline([a, b], { color: "#185846", dashArray: "6 8" }).addTo(map);
        });
      if (route.length > 0) map.fitBounds(L.latLngBounds(route).pad(0.25), { maxZoom: 10 });
      const resize = new ResizeObserver(() => {
        map.invalidateSize();
        if (route.length) map.fitBounds(L.latLngBounds(route).pad(0.25), { maxZoom: 10 });
      });
      resize.observe(element.current);
      cleanup = () => {
        resize.disconnect();
        map.remove();
      };
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [stops, onSelect, roadRoute, confirmed]);
  return (
    <div>
      <div
        ref={element}
        className="relative z-0 h-[420px] w-full border border-border"
        role="region"
        aria-label="Interactive destination map"
      />
      <p className="mt-3 text-xs text-muted-foreground">
        Square pins show operator-sourced accommodation locations; round pins are approximate
        destination areas. Dashed lines show stop order, not roads. Solid lines are estimated
        driving routes. Map tiles are provided by OpenStreetMap.
      </p>
    </div>
  );
}
