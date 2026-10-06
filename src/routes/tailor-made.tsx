import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero, Section, meta } from "@/components/site";
import { company, destinations, whatsapp } from "@/lib/pelican";

export const Route = createFileRoute("/tailor-made")({
  head: () => meta("Plan Your Safari", "Plan a flexible, tailor-made safari across Namibia, Botswana and Zimbabwe with Pelican.", "car-safari-scene"),
  component: TailorMade,
});

function TailorMade() {
  const [where, setWhere] = useState(destinations[0].name);
  const [people, setPeople] = useState("2");
  const [date, setDate] = useState("");
  const msg = `Hello Pelican, I'd like to plan a safari to ${where} for ${people} people${date ? ` around ${date}` : ""}.`;
  const field = "w-full border-b border-foreground/25 bg-transparent py-3 text-lg font-medium outline-none focus:border-primary";
  return (
    <>
      <PageHero eyebrow="Tailor-made" title="Plan your" accent="safari" image="car-safari-scene">
        {company.specialty}
      </PageHero>
      <Section className="grid gap-12 border-t border-border/60 md:grid-cols-12">
        <div className="space-y-8 md:col-span-6">
          <label className="block"><span className="text-sm text-muted-foreground">Where would you like to go?</span>
            <select value={where} onChange={(e) => setWhere(e.target.value)} className={field}>{destinations.map((d) => <option key={d.slug}>{d.name}</option>)}</select>
          </label>
          <label className="block"><span className="text-sm text-muted-foreground">Preferred date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </label>
          <label className="block"><span className="text-sm text-muted-foreground">Travellers</span>
            <input type="number" min={1} value={people} onChange={(e) => setPeople(e.target.value)} className={field} />
          </label>
          <a href={whatsapp(msg)} target="_blank" rel="noreferrer" className="inline-block rounded-lg bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground">Send via WhatsApp</a>
        </div>
        <div className="md:col-span-5 md:col-start-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Who we plan for</h2>
          <ul className="mt-4">{company.serve.map((s) => <li key={s} className="border-b border-border/60 py-3">{s}</li>)}</ul>
        </div>
      </Section>
    </>
  );
}
