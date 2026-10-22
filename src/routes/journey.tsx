import { AppSelect } from "@/components/ui/app-select";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Section } from "@/components/site";
import { JourneyDistances } from "@/components/journey-distances";
import type { RoadRoute } from "@/lib/journey-geography";
import { JourneyMap } from "@/components/journey-map";
import { Button } from "@/components/ui/button";
import { destinations, getDestination, getStay, stays, safarisFor } from "@/lib/pelican";
import { parseJourney, readJourney, saveJourney, type JourneyStop } from "@/lib/journey";

export const Route = createFileRoute("/journey")({
  validateSearch: (s: Record<string, unknown>): { plan?: string } => {
    const plan = parseJourney(s["plan"]);
    return plan.length ? { plan: JSON.stringify(plan) } : {};
  },
  component: JourneyPage,
  head: () => ({ meta: [{ title: "Build my journey — Pelican" }] }),
});
function JourneyPage() {
  const search = Route.useSearch();
  const [stops, setStops] = useState<JourneyStop[]>([]);
  const [selected, setSelected] = useState("etosha");
  const [roadRoute, setRoadRoute] = useState<RoadRoute>();
  const [message, setMessage] = useState("");
  useEffect(() => {
    setStops(search.plan ? parseJourney(search.plan) : readJourney());
  }, [search.plan]);
  const select = useCallback((slug: string) => setSelected(slug), []);
  const change = (next: JourneyStop[]) => {
    setStops(next);
    setMessage(saveJourney(next) ? "" : "Device storage is unavailable. Copy your journey link before leaving this page.");
  };
  const move = (i: number, delta: number) => {
    const next = [...stops];
    const other = next[i + delta];
    const stop = next[i];
    if (!stop || !other) return;
    next[i] = other;
    next[i + delta] = stop;
    change(next);
  };
  const destination = getDestination(selected);
  const nights = stops.reduce((sum, stop) => sum + stop.nights, 0);
  return (
    <Section>
      <h1 className="text-5xl font-bold">
        Build your <span className="text-clay">journey</span>
      </h1>
      <p className="mt-6 max-w-2xl text-muted-foreground">
        Explore destinations and accommodation. Pelican will confirm the route, travel time and
        availability. Only destination, stay and night preferences are saved on this device.
      </p>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <JourneyMap stops={stops} onSelect={select} roadRoute={roadRoute} />
          <JourneyDistances stops={stops} onRoute={setRoadRoute} />
          <label className="mt-6 block">
            Explore a destination
            <AppSelect
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="mt-2 w-full border-b bg-transparent py-3"
            >
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </AppSelect>
          </label>
          <h2 className="mt-8 text-2xl font-semibold">{destination?.name}</h2>
          <Link
            to="/destinations/$slug"
            params={{ slug: selected }}
            className="mt-3 block text-primary"
          >
            Discover this destination →
          </Link>
          <Button
            className="mt-5"
            disabled={stops.length >= 30}
            onClick={() => change([...stops, { destination: selected, nights: 1 }])}
          >
            Add destination
          </Button>
          <h3 className="mt-8 text-lg font-semibold">Places to stay</h3>
          {stays
            .filter((s) => s.destination === selected)
            .map((s) => (
              <Link
                key={s.slug}
                to="/stay/$slug"
                params={{ slug: s.slug }}
                className="mt-3 block text-primary"
              >
                {s.name} →
              </Link>
            ))}
          {!stays.some((s) => s.destination === selected) && (
            <p className="mt-3 text-muted-foreground">Pelican can recommend accommodation here.</p>
          )}
          <h3 className="mt-8 text-lg font-semibold">Safari inspiration</h3>
          {safarisFor(selected).map((s) => (
            <Link
              key={s.slug}
              to="/safaris/$slug"
              params={{ slug: s.slug }}
              className="mt-3 block text-primary"
            >
              {s.name} →
            </Link>
          ))}
        </div>
        <div>
          <h2 className="text-3xl font-semibold">My journey</h2>
          <ol className="mt-6 divide-y border-y border-border">
            {stops.map((stop, i) => (
              <li key={`${i}-${stop.destination}`} className="py-5">
                <p className="font-medium">
                  {i + 1}. {getDestination(stop.destination)?.name}
                </p>
                {stop.stay && (
                  <p className="mt-2 text-sm text-muted-foreground">{getStay(stop.stay)?.name}</p>
                )}
                <label className="mt-3 block text-sm">
                  Preferred nights
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={stop.nights}
                    className="ml-3 w-16 border-b bg-transparent py-2"
                    onChange={(e) =>
                      change(
                        stops.map((s, j) =>
                          j === i
                            ? {
                                ...s,
                                nights: Math.max(1, Math.min(90, Math.floor(Number(e.target.value)) || 1)),
                              }
                            : s,
                        ),
                      )
                    }
                  />
                </label>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="ghost"
                    disabled={i === 0}
                    aria-label={`Move stop ${i + 1} earlier`}
                    onClick={() => move(i, -1)}
                  >
                    Earlier
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={i === stops.length - 1}
                    aria-label={`Move stop ${i + 1} later`}
                    onClick={() => move(i, 1)}
                  >
                    Later
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`Remove stop ${i + 1}`}
                    onClick={() => change(stops.filter((_, j) => i !== j))}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ol>
          {!stops.length && <p className="mt-6">Choose a destination or stay to begin.</p>}
          <p className="mt-6 text-muted-foreground">
            {nights} preferred nights. Travel days and the final order need Pelican’s review.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link
                to="/tailor-made"
                search={{
                  journey: JSON.stringify(stops),
                  destinations: [...new Set(stops.map((s) => s.destination))].join(","),
                }}
              >
                Plan this journey
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const url = new URL("/journey", window.location.origin);
                  url.searchParams.set("plan", JSON.stringify(stops));
                  await navigator.clipboard.writeText(url.toString());
                  setMessage(
                    "Journey link copied. It contains only your destination and accommodation preferences.",
                  );
                } catch {
                  setMessage(
                    "Copy is unavailable in this browser. You can still send your journey through the Safari Brief.",
                  );
                }
              }}
            >
              Copy journey link
            </Button>
          </div>
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            {message}
          </p>
          <Link to="/stay" className="mt-8 block text-primary">
            Browse all stays →
          </Link>
        </div>
      </div>
    </Section>
  );
}
