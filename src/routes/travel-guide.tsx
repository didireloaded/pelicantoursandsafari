import { createFileRoute, Link } from "@tanstack/react-router";
import { TravelCalendar } from "@/components/travel-calendar";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { approvedSource, useApprovedTravelDetails } from "@/lib/approved-travel-details";
import { Section, Strip, meta } from "@/components/site";
import { company, stays, travelGuidance } from "@/lib/pelican";
export const Route = createFileRoute("/travel-guide")({ component: TravelGuide, head: () => meta("Travel guide", "Plan your safari with seasonal guidance, packing advice and practical travel information.") });
function TravelGuide() {
  const { rows, error } = useApprovedTravelDetails();
  const details = rows.filter(row => row.approved && approvedSource(row.source_url));
  return (
    <Section>
      <div className="grid gap-7 md:grid-cols-12 md:items-center">
        <div className="md:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Travel guide</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Plan with confidence</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">Seasonal guidance, practical preparation and answers for planning your journey.</p>
        </div>
        <Strip src="nature-landscape" shape="right" className="h-36 w-full md:col-span-5 md:h-44" loading="eager" fetchPriority="high" sizes="(min-width: 768px) 40vw, calc(100vw - 40px)" />
      </div>
      <div className="mt-8 flex flex-col gap-3 border-y border-border py-5 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Keep a copy for your trip and check linked sources again before travel.</p>
        <Button variant="outline" onClick={() => window.print()}>Print / save guide</Button>
      </div>
      <section className="mt-10 bg-muted px-6 py-7 md:px-8" aria-labelledby="quote-heading">
        <p className="text-sm font-semibold text-clay">Before you confirm</p>
        <h2 id="quote-heading" className="mt-2 text-3xl">Understanding your quote</h2>
        <p className="mt-4 max-w-4xl text-muted-foreground">{travelGuidance.pricing}</p>
      </section>
      <TravelCalendar />
      <h2 className="mt-10 text-3xl">When to visit</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Sources checked {travelGuidance.checked}. Check current advice before departure.
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
      {travelGuidance.seasons.map((x) => (
        <article key={x.title} className="border border-border p-6">
          <h3 className="text-xl">{x.title}</h3>
          <p className="my-3 text-muted-foreground">{x.body}</p>
          <a className="text-sm underline" href={x.source} target="_blank" rel="noreferrer">
            Tourism authority source →
          </a>
        </article>
      ))}
      </div>
      <h2 className="mt-10 text-3xl">Trip tips</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Sources checked {travelGuidance.tipsChecked}. Check current advice before departure.
      </p>
      <div className="mt-6 grid gap-x-8 md:grid-cols-2 lg:grid-cols-3">
      {travelGuidance.tips.map((x, index) => (
        <article key={x.title} className="border-t border-border py-6">
          <p className="text-sm text-clay">0{index + 1}</p>
          <h3 className="text-xl">{x.title}</h3>
          <p className="my-3 text-sm text-muted-foreground">{x.body}</p>
          <a className="text-sm underline" href={x.source} target="_blank" rel="noreferrer">
            Official source →
          </a>
        </article>
      ))}
      </div>
      <h2 className="mt-10 text-3xl">Travel questions</h2>
      {travelGuidance.faq.map((x) => (
        <Fragment key={x.title}><details className="border-b py-5 print:hidden">
          <summary className="cursor-pointer text-lg">{x.title}</summary>
          <p className="my-4 max-w-3xl">{x.body}</p>
          <a className="underline" href={x.source} target="_blank" rel="noreferrer">
            Read current guidance →
          </a>
        </details><article className="hidden border-b py-5 print:block"><h3 className="text-xl">{x.title}</h3><p className="my-4">{x.body}</p><p className="text-sm">Current guidance: {x.source}</p></article></Fragment>
      ))}
      <div className="mt-12 grid gap-10 border-y border-border py-10 md:grid-cols-2">
        <section aria-labelledby="team-heading">
          <h2 id="team-heading" className="text-3xl">Your Pelican team and transport</h2>
          <p className="mt-4">{company.lead}</p>
          <p className="mt-4 text-muted-foreground">{company.vehicles}</p>
          <p className="mt-4 text-sm">Ask which guide and vehicle will operate your journey, and request relevant credentials before confirming.</p>
        </section>
        <section aria-labelledby="accommodation-heading">
          <h2 id="accommodation-heading" className="text-3xl">Accommodation details</h2>
          <p className="mt-4 text-muted-foreground">Check the operator’s current photos and room information; ask Pelican to confirm family suitability, accessibility and availability for your dates.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {stays.map((x) => (
              <Link key={x.slug} to="/stay/$slug" params={{ slug: x.slug }} className="rounded-full border border-border px-4 py-2 text-sm hover:border-primary hover:text-primary">
                {x.name} →
              </Link>
            ))}
          </div>
        </section>
      </div>
      <h2 className="mt-10 text-3xl">Approved itineraries and information</h2>
      {error && (
        <p role="alert" className="mt-4">
          {error}
        </p>
      )}
      {!error && !details.length && (
        <p className="mt-4">
          Request a day-by-day itinerary with overnight stops, travel expectations, inclusions and
          exclusions for your own journey.
        </p>
      )}
      {details.map((x) => (
        <article key={x.id} className="border-b py-6">
          <p className="text-sm text-clay">{x.category}</p>
          <h3 className="mt-2 text-2xl">{x.title}</h3>
          <p className="my-4 whitespace-pre-wrap">{x.body}</p>
          {x.photo_url && approvedSource(x.photo_url) && (
            <img
              src={x.photo_url}
              alt={x.title}
              loading="lazy"
              decoding="async"
              className="my-6 max-h-96 w-full object-contain"
            />
          )}
          <a href={approvedSource(x.source_url)} className="underline" target="_blank" rel="noreferrer">
            Content source →
          </a>
          <p className="mt-2 text-sm">Reviewed {new Date(x.updated_at).toLocaleDateString()}</p>
        </article>
      ))}
      <Link to="/tailor-made" search={{}} className="mt-10 block underline">
        Ask Pelican to plan your journey →
      </Link>
    </Section>
  );
}
