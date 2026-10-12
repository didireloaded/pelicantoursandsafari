import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { JourneyStop } from "@/lib/journey";
import {
  directionsUrl,
  parseRoadRoute,
  stopName,
  stopPoint,
  straightLineKm,
  type RoadRoute,
} from "@/lib/journey-geography";
export function JourneyDistances({
  stops,
  onRoute,
}: {
  stops: JourneyStop[];
  onRoute: (route: RoadRoute | undefined) => void;
}) {
  const [road, setRoad] = useState<{ key: string; route: RoadRoute }>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const key = JSON.stringify(stops.map((s) => ({ destination: s.destination, stay: s.stay })));
  const route = road?.key === key ? road.route : undefined;
  useEffect(() => {
    onRoute(route);
  }, [route, onRoute]);
  useEffect(() => {
    setMessage("");
  }, [key]);
  const calculate = async () => {
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("journey-route", {
        body: { stops: JSON.parse(key) },
        signal: AbortSignal.timeout(15000),
      });
      if (error) throw error;
      setRoad({ key, route: parseRoadRoute(data, stops.length) });
    } catch {
      setMessage(
        "Road estimates are unavailable. Use directions below; straight-line distances are not driving distances.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold">Distances & directions</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Road estimates use OpenRouteService and exclude stops, traffic, border delays and park
        restrictions. Pelican must review the route. Calculating sends these locations to
        OpenRouteService; opening directions sends them to Google Maps.
      </p>
      {stops.length > 1 && (
        <Button
          className="mt-4"
          variant="outline"
          disabled={busy || stops.some((s) => !stopPoint(s))}
          onClick={calculate}
        >
          {busy ? "Calculating…" : "Calculate road distances"}
        </Button>
      )}
      <p role="status" className="mt-3 text-sm text-muted-foreground">
        {message}
      </p>
      <ol className="mt-4 divide-y border-y border-border">
        {stops.map((stop, i) => {
          const previous = stops[i - 1];
          const a = previous && stopPoint(previous);
          const b = stopPoint(stop);
          const leg = route?.legs[i - 1];
          return (
            <li key={i} className="py-4 text-sm">
              <p className="font-medium">
                {previous ? `${stopName(previous)} → ` : "Start: "}
                {stopName(stop)}
              </p>
              {previous && (
                <p className="mt-2 text-muted-foreground">
                  {leg
                    ? `${Math.round(leg.km)} km by road · about ${Math.floor(Math.round(leg.minutes) / 60)}h ${Math.round(leg.minutes) % 60}m driving`
                    : a && b
                      ? `${Math.round(straightLineKm(a, b))} km in a straight line — not road distance`
                      : "Distance unavailable until the property location is verified."}
                </p>
              )}
              <a
                href={directionsUrl(previous, stop)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-primary"
              >
                Open driving directions →
              </a>
            </li>
          );
        })}
      </ol>
      {!stops.length && <p className="mt-4 text-sm">Add stops to see distances and directions.</p>}
      <p className="mt-3 text-xs text-muted-foreground">
        Road data © OpenStreetMap contributors · routing by{" "}
        <a
          className="underline"
          href="https://openrouteservice.org"
          target="_blank"
          rel="noreferrer"
        >
          OpenRouteService / HeiGIT
        </a>
        .
      </p>
    </div>
  );
}
