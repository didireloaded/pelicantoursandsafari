import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Section, Strip, PlanCTA, meta } from "@/components/site";
import { destinations } from "@/lib/pelican";

export const Route = createFileRoute("/destinations/")({
  head: () => meta("Destinations", "Where Pelican travels: Etosha, Sossusvlei, the Skeleton Coast, Windhoek, Botswana, Zimbabwe and more.", "nature-landscape"),
  component: Destinations,
});

function Destinations() {
  const countries = ["Namibia", "Botswana", "Zimbabwe"];
  return (
    <>
      <PageHero eyebrow="Destinations" title="Where we" accent="travel" image="nature-landscape">
        Guided tours to all major Namibian destinations, with selected routes into Botswana and Zimbabwe.
      </PageHero>
      {countries.map((c, ci) => (
        <Section key={c} className="grid gap-8 border-t border-border/60 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{c}</h2>
            <Strip src={["savanna-plains-sunset", "zebra", "oryx"][ci]} shape={ci % 2 ? "left" : "right"} className="mt-6 h-28 w-full md:h-36" />
          </div>
          <ul className="md:col-span-7 md:col-start-6">
            {destinations.filter((d) => d.country === c).map((d) => (
              <li key={d.slug} className="border-b border-border/60">
                <Link to="/destinations/$slug" params={{ slug: d.slug }} className="flex items-center justify-between py-5 text-2xl font-semibold tracking-tight hover:text-clay md:text-3xl">
                  {d.name}<span className="text-base">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ))}
      <PlanCTA />
    </>
  );
}
