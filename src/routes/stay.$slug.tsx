import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Section } from "@/components/site";
import { getStay, getDestination, safarisFor, whatsapp } from "@/lib/pelican";
import { readJourney, saveJourney } from "@/lib/journey";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/stay/$slug")({
  loader: ({ params }) => {
    const stay = getStay(params.slug);
    if (!stay) throw notFound();
    return stay;
  },
  component: StayPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.name ?? "Stay not found"} — Pelican` }],
  }),
  notFoundComponent: () => (
    <Section>
      <h1 className="text-4xl">Stay not found</h1>
      <Link to="/stay">Browse stays</Link>
    </Section>
  ),
});
function StayPage() {
  const stay = Route.useLoaderData();
  const [nights, setNights] = useState(2);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  return (
    <Section>
      <p className="text-sm text-clay">
        {getDestination(stay.destination)?.name} · {stay.collection}
      </p>
      <h1 className="mt-4 text-5xl font-bold">{stay.name}</h1>
      <p className="mt-8 max-w-2xl text-lg leading-relaxed">{stay.description}</p>
      <h2 className="mt-10 text-2xl font-semibold">Facilities and experiences</h2>
      <ul className="mt-4 space-y-2">
        {stay.amenities.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      {stay.checkIn && (
        <p className="mt-6">
          Check-in {stay.checkIn} · Check-out {stay.checkOut}
        </p>
      )}
      <p className="mt-6 text-muted-foreground">
        Ask Pelican to confirm rates, room availability, child policies and booking terms for your
        dates. This is a booking request, not a reservation.
      </p>
      <div className="mt-8 flex flex-wrap items-end gap-4">
        <label>
          Preferred nights
          <input
            type="number"
            min={1}
            max={90}
            value={nights}
            onChange={(e) => setNights(Math.max(1, Math.min(90, Math.floor(Number(e.target.value)) || 1)))}
            className="mt-2 block w-24 border-b bg-transparent py-3"
          />
        </label>
        <Button
          onClick={() => {
            const stops = readJourney();
            const index = stops.findIndex((s) => s.stay === stay.slug);
            const stop = { destination: stay.destination, stay: stay.slug, nights };
            if (index >= 0) stops[index] = stop;
            else if (stops.length < 30) stops.push(stop);
            else {
              setError("Your journey has 30 stops. Remove a stop in Review journey before adding another.");
              return;
            }
            const saved = saveJourney(stops);
            setAdded(saved);
            setError(saved ? "" : "Device storage is unavailable. Please request this stay through Ask Pelican to book.");
          }}
        >
          {added ? "Journey preference saved" : "Add to my safari"}
        </Button>
        <Button asChild variant="outline">
          <Link to="/journey">Review journey</Link>
        </Button>
        <Button asChild variant="outline">
          <a
            href={whatsapp(
              `Hello Pelican, please help me request ${nights} nights at ${stay.name}. Dates and availability to discuss.`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            Ask Pelican to book
          </a>
        </Button>
      </div>
      <p role="status" className="mt-4 text-sm text-muted-foreground">
        {error || (added
          ? "Your accommodation preference has been added. Review the journey before sending it."
          : "Accommodation preferences only; no personal details are stored here.")}
      </p>
      <h2 className="mt-12 text-2xl font-semibold">Related safaris</h2>
      {safarisFor(stay.destination).map((s) => (
        <Link
          key={s.slug}
          to="/safaris/$slug"
          params={{ slug: s.slug }}
          className="mt-3 block text-primary"
        >
          {s.name} →
        </Link>
      ))}
      <p className="mt-10 text-sm text-muted-foreground">
        Details checked {stay.verifiedAt}.{" "}
        <a href={stay.source} target="_blank" rel="noreferrer" className="underline">
          Official property information and photographs
        </a>
        .
      </p>
      <Link to="/stay" className="mt-8 block text-primary">
        All stays →
      </Link>
    </Section>
  );
}
