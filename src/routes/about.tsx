import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section, Strip, PlanCTA, meta } from "@/components/site";
import { company } from "@/lib/pelican";

export const Route = createFileRoute("/about")({
  head: () => meta("About Pelican", "A proudly Namibian tour operator led by Kamwi Kays, offering professionally guided safaris and tours.", "savanna-plains-sunset"),
  component: About,
});

function About() {
  return (
    <>
      <PageHero eyebrow="About" title="Proudly" accent="Namibian" image="savanna-plains-sunset">{company.intro}</PageHero>
      <Section className="grid gap-10 border-t border-border/60 md:grid-cols-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay md:col-span-3">Our story</p>
        <div className="space-y-6 text-xl leading-relaxed md:col-span-8">
          <p>{company.lead}</p><p className="text-muted-foreground">{company.specialty}</p>
        </div>
      </Section>
      <Section className="grid gap-10 border-t border-border/60 md:grid-cols-12">
        <div className="md:col-span-5">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Our <span className="text-clay">philosophy</span></h2>
          <p className="mt-6 text-lg text-muted-foreground">{company.philosophy}</p>
        </div>
        <ol className="md:col-span-6 md:col-start-7">
          {company.values.map((v, i) => <li key={v} className="flex gap-6 border-b border-border/60 py-4 text-xl font-medium"><span className="text-sm text-muted-foreground">0{i + 1}</span>{v}</li>)}
        </ol>
      </Section>
      <Section className="pt-0 md:pt-0"><Strip src="zebra" shape="both" className="h-40 w-full md:h-64" /></Section>
      <Section className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5"><h2 className="text-4xl font-bold tracking-tight md:text-5xl">Why <span className="text-clay">Pelican</span></h2></div>
        <ul className="md:col-span-6 md:col-start-7">
          {company.why.map((w) => <li key={w} className="border-b border-border/60 py-4 text-lg">{w}</li>)}
          <li className="py-4 text-muted-foreground">{company.vehicles}</li>
        </ul>
      </Section>
      <PlanCTA />
    </>
  );
}
