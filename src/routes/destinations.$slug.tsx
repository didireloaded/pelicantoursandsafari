import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHero, Section, Strip, PlanCTA, meta } from "@/components/site";
import { getDestination, safarisFor, stays, whatsapp } from "@/lib/pelican";

export const Route = createFileRoute("/destinations/$slug")({
  loader: ({ params }) => {
    const destination = getDestination(params.slug);
    if (!destination) throw notFound();
    return { destination };
  },
  head: ({ loaderData }) =>
    loaderData
      ? meta(loaderData.destination.name, `Travel to ${loaderData.destination.name}, ${loaderData.destination.country}, with Pelican Tours and Safaris.`, loaderData.destination.image)
      : { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => <Section><h1 className="text-4xl font-bold">Destination not found</h1><Link to="/destinations" className="mt-6 inline-block text-primary">All destinations →</Link></Section>,
  component: DestinationPage,
});

function DestinationPage() {
  const { destination: d } = Route.useLoaderData();
  const related = safarisFor(d.slug);
  return (
    <>
      <PageHero eyebrow={d.country} title={d.name} image={d.image}>{d.note}</PageHero>
      <Section className="border-t border-border/60">
        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Safaris visiting <span className="text-clay">{d.name}</span></h2>
        <div className="mt-8">
          {related.map((s, i) => (
            <Link key={s.slug} to="/safaris/$slug" params={{ slug: s.slug }} className="group grid items-center gap-4 border-t border-border/70 py-6 md:grid-cols-12 md:gap-8">
              <h3 className="text-2xl font-semibold md:col-span-4 group-hover:text-clay">{s.name}</h3>
              <p className="text-muted-foreground md:col-span-4">{s.short}</p>
              <Strip src={s.image} shape={i % 2 ? "left" : "right"} className="h-20 w-full md:col-span-4" />
            </Link>
          ))}
        </div>
        <a href={whatsapp(`Hello Pelican, I'd like to travel to ${d.name}.`)} target="_blank" rel="noreferrer" className="mt-10 inline-block rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground">Ask about {d.name}</a>
      </Section>
      <Section className="pt-0 md:pt-0"><h2 className="text-3xl font-semibold">Places to stay</h2>{stays.filter((stay) => stay.destination === d.slug).map((stay) => <Link key={stay.slug} to="/stay/$slug" params={{ slug: stay.slug }} className="mt-4 block text-primary">{stay.name} →</Link>)}<Link to="/journey" className="mt-6 inline-block text-primary">Explore and build your journey →</Link></Section>
      <PlanCTA />
    </>
  );
}
