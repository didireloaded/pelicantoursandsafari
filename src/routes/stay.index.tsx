import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Section } from "@/components/site";
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
            <select
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
            </select>
          </label>
        ))}
      </div>
      <Link to="/journey" className="text-primary underline">
        Explore and plan on the map →
      </Link>
      <div className="mt-8 divide-y border-y border-border">
        {matches.map((stay) => (
          <Link
            key={stay.slug}
            to="/stay/$slug"
            params={{ slug: stay.slug }}
            className="block py-8"
          >
            <p className="text-sm text-clay">
              {getDestination(stay.destination)?.name} · {stay.collection}
            </p>
            <h2 className="mt-3 text-3xl font-semibold">{stay.name}</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{stay.description}</p>
            <span className="mt-4 block text-primary">View stay →</span>
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
