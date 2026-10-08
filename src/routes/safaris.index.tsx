import { useState } from "react";
import { Button } from "@/components/ui/button";
import { findSafaris } from "@/lib/safari-discovery";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Section, Strip, PlanCTA, meta } from "@/components/site";
import { safaris, destinations, safariInterests, getDestination } from "@/lib/pelican";

export const Route = createFileRoute("/safaris/")({
  head: () => meta("Safaris & Tours", "Big Five safaris, Windhoek city tours, Namibian highlights and cross-border tours with Pelican.", "leopard"),
  component: Safaris,
});

function Safaris() {
  const [country, setCountry] = useState("");
  const [destination, setDestination] = useState("");
  const [interest, setInterest] = useState("");
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
          <label className="text-sm">Country<select aria-label="Country" className={field} value={country} onChange={(e) => { setCountry(e.target.value); setDestination(""); }}><option value="">All countries</option>{["Namibia", "Botswana", "Zimbabwe"].map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm">Destination<select aria-label="Destination" className={field} value={destination} onChange={(e) => setDestination(e.target.value)}><option value="">All destinations</option>{destinations.filter((d) => !country || d.country === country).map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select></label>
          <label className="text-sm">Experience<select aria-label="Experience" className={field} value={interest} onChange={(e) => setInterest(e.target.value)}><option value="">All experiences</option>{Array.from(new Set(Object.values(safariInterests).flat())).map((x) => <option key={x}>{x}</option>)}</select></label>
        </div>
        <p aria-live="polite" className="mb-5 text-sm text-muted-foreground">{matches.length} {matches.length === 1 ? "journey" : "journeys"}</p>
        {!matches.length && <div className="border-y border-border py-12"><h2 className="text-2xl font-semibold">A journey shaped around you.</h2><Button asChild className="mt-6"><Link to="/tailor-made" search={destination ? { destinations: destination } : {}}>Ask us to build it</Link></Button><Button variant="ghost" className="ml-3" onClick={() => { setCountry(""); setDestination(""); setInterest(""); }}>Clear filters</Button></div>}
        {matches.map((s, i) => (
          <article key={s.slug} className="group grid gap-6 border-t border-border/70 py-10 md:grid-cols-12 md:gap-10 md:py-14">
            <Strip src={s.image} shape={i % 2 ? "left" : "right"} className={`h-56 w-full md:col-span-7 md:h-80 ${i % 2 ? "md:order-2" : ""}`} />
            <div className="md:col-span-5 md:self-center">
              <span className="text-sm text-muted-foreground">0{i + 1}</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl group-hover:text-clay">{s.name}</h2>
              <p className="mt-4 text-muted-foreground">{s.overview}</p>
              <p className="mt-4 text-sm">{s.destinations.map((d) => getDestination(d)?.name).join(" · ")}</p>
              <div className="mt-6 flex flex-wrap items-center gap-5"><Button asChild variant="link" className="px-0"><Link to="/safaris/$slug" params={{ slug: s.slug }}>View safari →</Link></Button><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={compared.includes(s.slug)} onChange={(e) => setCompared((prev) => e.target.checked ? [...prev, s.slug] : prev.filter((slug) => slug !== s.slug))} />Compare</label></div>
            </div>
          </article>
        ))}
        {selected.length > 0 && <section className="mt-10 border-t border-border pt-8" aria-label="Safari comparison"><div className="flex items-center justify-between gap-4"><h2 className="text-3xl font-bold">Compare journeys</h2><Button variant="ghost" onClick={() => setCompared([])}>Clear comparison</Button></div>{selected.length < 2 ? <p className="mt-4 text-muted-foreground">Select another journey to compare.</p> : <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><caption className="sr-only">Selected safari comparison</caption><thead><tr><th className="py-4 pr-5">Journey</th>{selected.map((s) => <th key={s.slug} className="p-4"><Link to="/safaris/$slug" params={{ slug: s.slug }} className="text-primary">{s.name}</Link></th>)}</tr></thead><tbody>{["Destinations", "Experience", "Duration", "Accommodation", "Price", "Private / group"].map((row) => <tr key={row} className="border-t border-border"><th className="py-4 pr-5 font-medium">{row}</th>{selected.map((s) => <td key={s.slug} className="p-4 align-top text-muted-foreground">{row === "Destinations" ? s.destinations.map((d) => getDestination(d)?.name).join(" · ") : row === "Experience" ? safariInterests[s.slug]?.join(" · ") : "Confirm with Pelican"}</td>)}</tr>)}</tbody></table></div>}</section>}
      </Section>
      <PlanCTA />
    </>
  );
}
