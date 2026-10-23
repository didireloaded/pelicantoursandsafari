import { AppSelect } from "@/components/ui/app-select";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Photo, Section } from "@/components/site";
import { destinations, getDestination, stays } from "@/lib/pelican";

export const Route = createFileRoute("/stay/")({
  component: StayIndex,
  head: () => ({
    meta: [
      { title: "Places to stay — Pelican" },
      {
        name: "description",
        content:
          "Explore accommodation by destination and request your preferred stay through Pelican.",
      },
    ],
  }),
});
function StayIndex() {
  const [destination, setDestination] = useState("");
  const [type, setType] = useState("");
  const [collection, setCollection] = useState("");
  const matches = stays.filter(
    (s) =>
      (!destination || s.destination === destination) &&
      (!type || s.type === type) &&
      (!collection || s.collection === collection),
  );
  return (
    <Section>
      <h1 className="text-5xl font-bold tracking-tight">
        Places to <span className="text-clay">stay</span>
      </h1>
      <p className="mt-6 text-muted-foreground">
        Choose a destination, explore accommodation, and add your preferences to your journey.
        Availability and rates need confirmation.
      </p>
      <div className="my-10 grid gap-6 md:grid-cols-3">
        {[
          [
            "Destination",
            destination,
            setDestination,
            destinations
              .filter((d) => stays.some((s) => s.destination === d.slug))
              .map((d) => [d.slug, d.name]),
          ],
          ["Type", type, setType, [...new Set(stays.map((s) => s.type))].map((x) => [x, x])],
          [
            "Collection",
            collection,
            setCollection,
            [...new Set(stays.map((s) => s.collection))].map((x) => [x, x]),
          ],
        ].map(([label, value, setter, options]) => (
          <label key={label as string}>
            {label as string}
            <AppSelect
              className="mt-2 w-full border-b bg-transparent py-3"
              value={value as string}
              onChange={(e) => (setter as (v: string) => void)(e.target.value)}
            >
              <option value="">All</option>
              {(options as string[][]).map(([v, text]) => (
                <option key={v} value={v}>
                  {text}
                </option>
              ))}
            </AppSelect>
          </label>
        ))}
      </div>
      <Link to="/journey" className="text-primary underline">
        Explore and plan on the map →
      </Link>
      <p aria-live="polite" className="mt-8 text-sm text-muted-foreground">
        {matches.length} {matches.length === 1 ? "place" : "places"} to explore
      </p>
      <div className="mt-5 grid gap-x-8 gap-y-10 md:grid-cols-2">
        {matches.map((stay) => (
          <Link
            key={stay.slug}
            to="/stay/$slug"
            params={{ slug: stay.slug }}
            className="group block"
          >
            <div className="overflow-hidden rounded-r-[4rem] bg-muted">
              <Photo
                name={getDestination(stay.destination)?.image ?? "nature-landscape"}
                alt={`${getDestination(stay.destination)?.name ?? stay.name} landscape`}
                sizes="(min-width: 768px) 46vw, calc(100vw - 40px)"
                className="discovery-card-image h-48 w-full object-cover md:h-56"
              />
            </div>
            <div className="pt-5">
              <p className="text-sm text-clay">
                {getDestination(stay.destination)?.name} · {stay.type}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight group-hover:text-clay md:text-3xl">
                {stay.name}
              </h2>
              <p className="mt-3 line-clamp-2 text-muted-foreground">{stay.description}</p>
              <span className="mt-4 block font-medium text-primary">View stay →</span>
            </div>
          </Link>
        ))}
        {!matches.length && (
          <p className="py-8">
            No listed stays match these filters.{" "}
            <Link to="/tailor-made" search={{}}>
              Ask Pelican to recommend a stay.
            </Link>
          </p>
        )}
      </div>
    </Section>
  );
}
