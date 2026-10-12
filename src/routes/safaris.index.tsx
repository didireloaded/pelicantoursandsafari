import { useApprovedSafariPackages } from "@/lib/approved-travel-details";
import { SafariPackageSummary } from "@/components/approved-safari-package";
import { startingRate, formatNad } from "@/lib/safari-package";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { discoverySearch, findSafaris } from "@/lib/safari-discovery";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Section, Strip, PlanCTA, meta } from "@/components/site";
import { safaris, destinations, safariInterests, getDestination } from "@/lib/pelican";

export const Route = createFileRoute("/safaris/")({
  validateSearch: discoverySearch,
  head: () => meta("Safaris & Tours", "Big Five safaris, Windhoek city tours, Namibian highlights and cross-border tours with Pelican.", "leopard"),
  component: Safaris,
});

function Safaris() {
  const { packages } = useApprovedSafariPackages();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const country = search.country ?? "";
  const destination = search.destination ?? "";
  const interest = search.interest ?? "";
  const filter = (next: Record<string, unknown>) => void navigate({ search: discoverySearch(next), replace: true });
  const [compared, setCompared] = useState<string[]>([]);
  const matches = findSafaris(country, destination, interest);
  const selected = safaris.filter((s) => compared.includes(s.slug));
  const field = "w-full border-b border-foreground/25 bg-transparent py-3 outline-none focus:border-primary";
  return (
    <>
      <PageHero eyebrow="Safaris & tours" title="Guided" accent="journeys" image="leopard">
        From city tours to Big Five safaris and multi-day regional expeditions.
      </PageHero>
      <Section className="pt-0 md:pt-0">
        <div className="mb-8 grid gap-6 border-t border-border/60 py-6 md:grid-cols-3">
          <label className="text-sm">Country<select aria-label="Country" className={field} value={country} onChange={(e) => { filter({ ...search, country: e.target.value || undefined, destination: undefined }); }}><option value="">All countries</option>{["Namibia", "Botswana", "Zimbabwe"].map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm">Destination<select aria-label="Destination" className={field} value={destination} onChange={(e) => filter({ ...search, destination: e.target.value || undefined })}><option value="">All destinations</option>{destinations.filter((d) => !country || d.country === country).map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select></label>
          <label className="text-sm">Experience<select aria-label="Experience" className={field} value={interest} onChange={(e) => filter({ ...search, interest: e.target.value || undefined })}><option value="">All experiences</option>{Array.from(new Set(Object.values(safariInterests).flat())).map((x) => <option key={x}>{x}</option>)}</select></label>
        </div>
        <p aria-live="polite" className="mb-5 text-sm text-muted-foreground">{matches.length} {matches.length === 1 ? "journey" : "journeys"}</p>
        {!matches.length && <div className="border-y border-border py-12"><h2 className="text-2xl font-semibold">A journey shaped around you.</h2><Button asChild className="mt-6"><Link to="/tailor-made" search={destination ? { destinations: destination } : {}}>Ask us to build it</Link></Button><Button variant="ghost" className="ml-3" onClick={() => { filter({}); }}>Clear filters</Button></div>}
        {matches.map((s, i) => (
          <article key={s.slug} className="discovery-card group grid gap-6 border-t border-border/70 py-10 md:grid-cols-12 md:gap-10 md:py-14">
            <Strip animateOnHover sizes="(min-width: 1440px) 780px, (min-width: 768px) 57vw, calc(100vw - 40px)" src={s.image} shape={i % 2 ? "left" : "right"} className={`h-48 w-full md:col-span-7 md:h-64 ${i % 2 ? "md:order-2" : ""}`} />
            <div className="md:col-span-5 md:self-center">
              <span className="text-sm text-muted-foreground">0{i + 1}</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl group-hover:text-clay">{s.name}</h2>
              <p className="mt-4 text-muted-foreground">{s.overview}</p>
              <p className="mt-4 text-sm">{s.destinations.map((d) => getDestination(d)?.name).join(" · ")}</p>
              {packages[s.slug] && <SafariPackageSummary details={packages[s.slug]!.details} />}
              <div className="mt-6 flex flex-wrap items-center gap-5"><Button asChild variant="link" className="px-0"><Link to="/safaris/$slug" params={{ slug: s.slug }}>View safari <span aria-hidden="true" className="discovery-card-arrow inline-block">→</span></Link></Button><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={compared.includes(s.slug)} onChange={(e) => setCompared((prev) => e.target.checked ? [...prev, s.slug] : prev.filter((slug) => slug !== s.slug))} />Compare</label></div>
            </div>
          </article>
        ))}
        {selected.length > 0 && <section className="mt-10 border-t border-border pt-8" aria-label="Safari comparison"><div className="flex items-center justify-between gap-4"><h2 className="text-3xl font-bold">Compare journeys</h2><Button variant="ghost" onClick={() => setCompared([])}>Clear comparison</Button></div>{selected.length < 2 ? <p className="mt-4 text-muted-foreground">Select another journey to compare.</p> : <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><caption className="sr-only">Selected safari comparison</caption><thead><tr><th className="py-4 pr-5">Journey</th>{selected.map((s) => <th key={s.slug} className="p-4"><Link to="/safaris/$slug" params={{ slug: s.slug }} className="text-primary">{s.name}</Link></th>)}</tr></thead><tbody>{["Destinations", "Experience", "Duration", "Accommodation", "Price", "Private / group"].map((row) => <tr key={row} className="border-t border-border"><th className="py-4 pr-5 font-medium">{row}</th>{selected.map((s) => <td key={s.slug} className="p-4 align-top text-muted-foreground">{row === "Destinations" ? s.destinations.map((d) => getDestination(d)?.name).join(" · ") : row === "Experience" ? safariInterests[s.slug]?.join(" · ") : row === "Duration" && packages[s.slug]?.details.durationDays ? `${packages[s.slug]!.details.durationDays} days` : row === "Price" && packages[s.slug] && startingRate(packages[s.slug]!.details) ? `From ${formatNad(startingRate(packages[s.slug]!.details)!.amountNad)} per person sharing; see seasonal conditions` : "Confirm with Pelican"}</td>)}</tr>)}</tbody></table></div>}</section>}
      </Section>
      <PlanCTA />
    </>
  );
}
