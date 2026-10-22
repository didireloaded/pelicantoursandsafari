import { useApprovedSafariPackages } from "@/lib/approved-travel-details";
import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { PageHero, Section, Strip, PlanCTA, meta } from "@/components/site";
import { getSafari, getDestination, whatsapp, stays, travelGuidance } from "@/lib/pelican";
import { tripCodeFor } from "@/lib/booking";

import { JourneyMap } from "@/components/journey-map";
import { JourneyDistances } from "@/components/journey-distances";
import { startingRate } from "@/lib/safari-package";
import type { JourneyStop } from "@/lib/journey";
import type { RoadRoute } from "@/lib/journey-geography";
import { SafariPackageDetails } from "@/components/approved-safari-package";
import { SafariPlanningSteps, PelicanContactInfo, ApprovedTravelTrust } from "@/components/safari-planning";

export const Route = createFileRoute("/safaris/$slug")({
  loader: ({ params }) => {
    const safari = getSafari(params.slug);
    if (!safari) throw notFound();
    return { safari };
  },
  head: ({ loaderData }) =>
    loaderData ? meta(loaderData.safari.name, loaderData.safari.overview, loaderData.safari.image) : { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => <Section><h1 className="text-4xl font-bold">Safari not found</h1><Link to="/safaris" className="mt-6 inline-block text-primary">All safaris →</Link></Section>,
  component: SafariPage,
});

function SafariPage() {
  const { safari } = Route.useLoaderData();
  const dests = safari.destinations.map(getDestination).filter((d) => !!d);
  const { packages, error, reload } = useApprovedSafariPackages();
  const approved = packages[safari.slug];
  const hasItinerary = !!approved?.details.days.length;
  const hasRates = !!approved && !!startingRate(approved.details);
  const accommodation = stays.filter((stay) => safari.destinations.includes(stay.destination));
  const navigate = useNavigate();
  // Map helpers require nights; this adapter is never shown or submitted as an itinerary.
  const mapStops = useMemo<JourneyStop[]>(() => safari.destinations.map((destination) => ({ destination, nights: 1 })), [safari.destinations]);
  const selectDestination = useCallback((slug: string) => { void navigate({ to: "/destinations/$slug", params: { slug } }); }, [navigate]);
  const links = [
    { id: "overview", label: "Overview" },
    ...(hasItinerary ? [{ id: "itinerary", label: "Itinerary" }] : []),
    { id: "accommodation", label: "Accommodation" },
    { id: "map", label: "Map" },
    { id: "pricing", label: "Pricing" },
    { id: "enquire", label: "Enquire" },
  ];
  return (
    <>
      <PageHero eyebrow={dests.map((d) => d.name).join(" · ")} title={safari.name} image={safari.image} />
      <nav aria-label="On this safari page" className="sticky top-16 md:top-20 z-20 border-y border-border bg-background">
        <div className="mx-auto flex max-w-[1440px] gap-5 overflow-x-auto px-5 md:px-10">
          {links.map((link) => <a key={link.id} href={`#${link.id}`} className="shrink-0 py-4 text-sm font-semibold hover:text-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{link.label}</a>)}
        </div>
      </nav>
      <Section className="grid gap-12 md:grid-cols-12">
        <div id="overview" className="scroll-mt-40 md:col-span-7">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Overview</h2>
          <p className="mt-4 text-2xl font-medium leading-snug md:text-3xl">{safari.overview}</p>
          <p className="mt-8 text-muted-foreground">Itinerary, duration and inclusions are arranged with Pelican for each trip. Get in touch to shape the details.</p>
        </div>
        <aside className="md:col-span-4 md:col-start-9">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Destinations</h2>
          <ul className="mt-4">
            {dests.map((d) => (
              <li key={d.slug} className="border-b border-border/60">
                <Link to="/destinations/$slug" params={{ slug: d.slug }} className="block py-3 font-medium hover:text-clay">{d.name}</Link>
              </li>
            ))}
          </ul>
          {tripCodeFor(safari.slug) && <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-clay">Trip code: {tripCodeFor(safari.slug)}</p>}
          <div className="mt-8 flex flex-col gap-3">
            <a href={whatsapp(`Hello Pelican, I'm interested in the ${safari.name}.`)} target="_blank" rel="noreferrer" className="rounded-lg bg-primary px-6 py-3.5 text-center text-sm font-semibold text-primary-foreground">Enquire on WhatsApp</a>
            {tripCodeFor(safari.slug) && <Link to="/book" search={{ trip: tripCodeFor(safari.slug) }} className="rounded-lg border border-foreground/20 px-6 py-3.5 text-center text-sm font-semibold">Request to book</Link>}
            <Link to="/tailor-made" search={{ safari: safari.slug }} className="rounded-lg border border-foreground/20 px-6 py-3.5 text-center text-sm font-semibold">Plan this Safari</Link>
          </div>
        </aside>
      </Section>
      <Section className="pt-0 md:pt-0">
        <Strip src={dests[0]?.image ?? safari.image} shape="both" className="h-48 w-full md:h-72" />
      </Section>
      {approved && <Section className="pt-0 md:pt-0"><SafariPackageDetails {...approved} /></Section>}
      {!hasRates && <Section className="pt-0 md:pt-0"><div id="pricing" className="scroll-mt-40 max-w-3xl">
        <h2 className="text-3xl font-bold tracking-tight">What affects your quote</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">{travelGuidance.pricing}</p>
        {error && <div role="status" className="mt-4 text-sm text-muted-foreground"><p>Approved package details could not be loaded. Ask Pelican to confirm current rates and itinerary.</p><button type="button" onClick={reload} className="mt-2 underline">Try loading details again</button></div>}
      </div></Section>}
      <Section className="pt-0 md:pt-0"><div id="accommodation" className="scroll-mt-40">
        <h2 className="text-3xl font-bold tracking-tight">Accommodation to explore</h2>
        <p className="mt-4 max-w-3xl text-muted-foreground">These stays are in destinations associated with this safari. They are options to discuss, not included accommodation or confirmed reservations. Pelican will confirm availability, room type and cost for your dates.</p>
        {accommodation.length ? <div className="mt-8 grid gap-6 md:grid-cols-2">
          {accommodation.map((stay) => <article key={stay.slug} className="border-t border-border pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">{getDestination(stay.destination)?.name} · {stay.type}</p>
            <h3 className="mt-3 text-xl font-semibold"><Link to="/stay/$slug" params={{ slug: stay.slug }} className="hover:text-clay">{stay.name} →</Link></h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stay.description}</p>
          </article>)}
        </div> : <p className="mt-6 text-sm text-muted-foreground">Ask Pelican for accommodation suggestions matched to your route and budget.</p>}
      </div></Section>
      <Section className="pt-0 md:pt-0"><div id="map" className="scroll-mt-40">
        <h2 className="text-3xl font-bold tracking-tight">Explore the destinations</h2>
        <p className="mb-6 mt-4 max-w-3xl text-muted-foreground">The map connects catalogue destinations in their listed order to help you explore. This is an illustrative sequence, not a confirmed travel route or day-by-day itinerary. Travel time, access and overnight stops must be agreed with Pelican.</p>
        <SafariDestinationMap key={safari.slug} stops={mapStops} onSelect={selectDestination} />
      </div></Section>
      <Section className="pt-0 md:pt-0"><div id="enquire" className="scroll-mt-40 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Plan this safari with Pelican</h2>
          <p className="mt-4 text-muted-foreground">Share your dates, group size, interests and budget. A planning request starts a conversation; it does not reserve a safari or accommodation.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/tailor-made" search={{ safari: safari.slug }} className="rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground">Build your Safari Brief</Link>
            <a href={whatsapp(`Hello Pelican, I'm interested in the ${safari.name}.`)} target="_blank" rel="noreferrer" className="rounded-lg border border-foreground/20 px-6 py-3.5 text-sm font-semibold">Ask on WhatsApp</a>
          </div>
          <div className="mt-8"><PelicanContactInfo /></div>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Explore with confidence</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Review practical travel advice and ask for written payment and cancellation terms before confirming your journey.</p>
          <Link to="/travel-guide" className="mt-4 inline-block text-sm font-semibold text-primary">Read the travel guide →</Link>
          <Link to="/about" className="mt-4 block text-sm font-semibold text-primary">About the team →</Link>
          <ApprovedTravelTrust />
        </div>
      </div><div className="mt-12"><SafariPlanningSteps /></div></Section>
      <PlanCTA />
    </>
  );
}

function SafariDestinationMap({ stops, onSelect }: { stops: JourneyStop[]; onSelect: (slug: string) => void }) {
  const [roadRoute, setRoadRoute] = useState<RoadRoute>();
  return <>
    <JourneyMap stops={stops} onSelect={onSelect} roadRoute={roadRoute} />
    <JourneyDistances stops={stops} onRoute={setRoadRoute} />
  </>;
}
