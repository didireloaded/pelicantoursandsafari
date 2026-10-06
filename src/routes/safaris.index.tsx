import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Section, Strip, PlanCTA, meta } from "@/components/site";
import { safaris, getDestination } from "@/lib/pelican";

export const Route = createFileRoute("/safaris/")({
  head: () => meta("Safaris & Tours", "Big Five safaris, Windhoek city tours, Namibian highlights and cross-border tours with Pelican.", "rhino"),
  component: Safaris,
});

function Safaris() {
  return (
    <>
      <PageHero eyebrow="Safaris & tours" title="Guided" accent="journeys" image="leopard">
        From city tours to Big Five safaris and multi-day regional expeditions.
      </PageHero>
      <Section className="pt-0 md:pt-0">
        {safaris.map((s, i) => (
          <Link key={s.slug} to="/safaris/$slug" params={{ slug: s.slug }} className="group grid gap-6 border-t border-border/70 py-10 md:grid-cols-12 md:gap-10 md:py-14">
            <Strip src={s.image} shape={i % 2 ? "left" : "right"} className={`h-56 w-full md:col-span-7 md:h-80 ${i % 2 ? "md:order-2" : ""}`} />
            <div className="md:col-span-5 md:self-center">
              <span className="text-sm text-muted-foreground">0{i + 1}</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl group-hover:text-clay">{s.name}</h2>
              <p className="mt-4 text-muted-foreground">{s.overview}</p>
              <p className="mt-4 text-sm">{s.destinations.map((d) => getDestination(d)?.name).join(" · ")}</p>
              <span className="mt-6 inline-block border-b border-foreground pb-1 text-sm font-semibold">View safari</span>
            </div>
          </Link>
        ))}
      </Section>
      <PlanCTA />
    </>
  );
}
