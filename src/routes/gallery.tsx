import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Section, meta } from "@/components/site";
import { destinations, getDestination } from "@/lib/pelican";

export const Route = createFileRoute("/gallery")({
  validateSearch: (search: Record<string, unknown>): { destination?: string } => {
    const destination = typeof search["destination"] === "string" ? getDestination(search["destination"]) : undefined;
    return destination ? { destination: destination.slug } : {};
  },
  head: () => meta("Gallery", "Browse Pelican's destination photo albums across Namibia, Botswana and Zimbabwe."),
  component: Gallery,
});

// Album photos have not been supplied; catalogue images are not guest-trip photography.
function Gallery() {
  const search = Route.useSearch();
  const destination = search.destination ? getDestination(search.destination) : undefined;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [search.destination]);
  return (
    <Section>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Gallery</p>
      {destination ? <>
        <Link to="/gallery" search={{}} className="mt-6 inline-block text-sm font-semibold text-primary">← All destination albums</Link>
        <h1 ref={heading} tabIndex={-1} className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">{destination.name}</h1>
        <p className="mt-4 text-sm text-muted-foreground">{destination.country}</p>
        <div className="mt-10 border-y border-border/70 py-12" role="status">
          <h2 className="text-2xl font-semibold">No photos added yet</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">This destination album is ready for Pelican’s photos. There are no photos to browse here yet.</p>
        </div>
      </> : <>
        <h1 ref={heading} tabIndex={-1} className="mt-4 text-5xl font-bold tracking-tight md:text-7xl">On the <span className="text-clay">road</span></h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">Choose a destination to open its photo album. Photos have not been added to these albums yet.</p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Destination albums">
          {destinations.map((place) => <li key={place.slug}>
            <Link to="/gallery" search={{ destination: place.slug }} className="flex h-full flex-col rounded-lg border border-border/70 p-6 hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-primary">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">{place.country}</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">{place.name}</h2>
              <p className="mt-3 text-sm text-muted-foreground">No photos added yet</p>
              <span className="mt-6 text-sm font-semibold text-primary">Open album →</span>
            </Link>
          </li>)}
        </ul>
      </>}
    </Section>
  );
}
