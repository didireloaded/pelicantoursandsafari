import { createFileRoute, Link } from "@tanstack/react-router";
import { TravelCalendar } from "@/components/travel-calendar";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { approvedSource, useApprovedTravelDetails } from "@/lib/approved-travel-details";
import { Section } from "@/components/site";
import { company, stays, travelGuidance } from "@/lib/pelican";
export const Route = createFileRoute("/travel-guide")({ component: TravelGuide });
function TravelGuide() {
  const { rows, error } = useApprovedTravelDetails();
  const details = rows.filter(row => row.approved && approvedSource(row.source_url));
  return (
    <Section>
      <h1 className="font-display text-5xl">Plan with confidence</h1>
      <div className="mt-6 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>Print / save travel guide</Button>
        <p className="mt-3 text-sm text-muted-foreground">Choose Save as PDF in your browser’s print options to keep a copy. Check linked sources again before travel.</p>
      </div>
      <h2 className="mt-10 text-3xl">Understanding your quote</h2>
      <p className="mt-4 max-w-3xl text-muted-foreground">{travelGuidance.pricing}</p>
      <TravelCalendar />
      <h2 className="mt-10 text-3xl">When to visit</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Sources checked {travelGuidance.checked}. Check current advice before departure.
      </p>
      {travelGuidance.seasons.map((x) => (
        <article key={x.title} className="border-b py-6">
          <h3 className="text-xl">{x.title}</h3>
          <p className="my-3 max-w-3xl">{x.body}</p>
          <a className="underline" href={x.source} target="_blank" rel="noreferrer">
            Tourism authority source →
          </a>
        </article>
      ))}
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
      <h2 className="mt-10 text-3xl">Your Pelican team and transport</h2>
      <p className="mt-4">{company.lead}</p>
      <p className="mt-4">{company.vehicles}</p>
      <p className="mt-4">
        Ask which guide and vehicle will operate your journey, and request relevant credentials
        before confirming.
      </p>
      <h2 className="mt-10 text-3xl">Accommodation details</h2>
      <p className="mt-4">
        Check the operator’s current photos and room information; ask Pelican to confirm family
        suitability, accessibility and availability for your dates.
      </p>
      {stays.map((x) => (
        <Link
          key={x.slug}
          to="/stay/$slug"
          params={{ slug: x.slug }}
          className="mt-4 block underline"
        >
          {x.name} →
        </Link>
      ))}
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
