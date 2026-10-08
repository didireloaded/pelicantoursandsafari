import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHero, Section, Strip, PlanCTA, meta } from "@/components/site";
import { getSafari, getDestination, whatsapp } from "@/lib/pelican";

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
  return (
    <>
      <PageHero eyebrow={dests.map((d) => d.name).join(" · ")} title={safari.name} image={safari.image} />
      <Section className="grid gap-12 pt-0 md:grid-cols-12 md:pt-0">
        <div className="md:col-span-7">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Overview</h2>
          <p className="mt-4 text-2xl font-medium leading-snug md:text-3xl">{safari.overview}</p>
          <p className="mt-8 text-muted-foreground">Itinerary, duration and inclusions are arranged with Pelican for each trip. Get in touch to shape the details.</p>
        </div>
        <aside className="md:col-span-4 md:col-start-9">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Route</h2>
          <ul className="mt-4">
            {dests.map((d) => (
              <li key={d.slug} className="border-b border-border/60">
                <Link to="/destinations/$slug" params={{ slug: d.slug }} className="block py-3 font-medium hover:text-clay">{d.name}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3">
            <a href={whatsapp(`Hello Pelican, I'm interested in the ${safari.name}.`)} target="_blank" rel="noreferrer" className="rounded-lg bg-primary px-6 py-3.5 text-center text-sm font-semibold text-primary-foreground">Enquire on WhatsApp</a>
            <Link to="/tailor-made" search={{ safari: safari.slug }} className="rounded-lg border border-foreground/20 px-6 py-3.5 text-center text-sm font-semibold">Plan this Safari</Link>
          </div>
        </aside>
      </Section>
      <Section className="pt-0 md:pt-0">
        <Strip src={dests[0]?.image ?? safari.image} shape="both" className="h-48 w-full md:h-72" />
      </Section>
      <PlanCTA />
    </>
  );
}
