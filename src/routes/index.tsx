import { createFileRoute, Link } from "@tanstack/react-router";
import { Strip, Photo, Section, PlanCTA, meta } from "@/components/site";
import { company, destinations, safaris } from "@/lib/pelican";

export const Route = createFileRoute("/")({
  head: () => meta("Discover Namibia", "Big Five safaris in Etosha, Windhoek city tours, Namibian highlights and cross-border trips to Botswana and Zimbabwe.", "savanna-plains-sunset"),
  component: Home,
});

function Home() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-10 md:px-10 md:pb-24 md:pt-16">
        <h1 className="text-5xl font-bold leading-[1.02] md:text-[clamp(3rem,6.6vw,6rem)]">
          <div className="flex items-center gap-3 md:gap-5">
            <span className="md:whitespace-nowrap">Discover <span className="text-clay">Namibia</span></span>
            <Strip src="rhino" loading="eager" media="(min-width: 768px)" sizes="50vw" className="hidden h-[0.85em] w-0 flex-1 md:block" />
          </div>
          <div className="mt-2 flex items-center gap-3 md:gap-5">
            <Strip src="zebra" shape="left" loading="eager" media="(min-width: 768px)" sizes="50vw" className="hidden h-[0.85em] w-0 flex-1 md:block" />
            <span>through</span>
          </div>
          <div className="mt-2 flex items-center gap-3 md:gap-5">
            <span className="text-clay">wild</span>
            <Strip src="leopard" shape="both" loading="eager" media="(min-width: 768px)" sizes="50vw" className="hidden h-[0.85em] w-0 flex-1 md:block" />
            <span>places.</span>
          </div>
        </h1>
        <Strip src="leopard" loading="eager" fetchPriority="high" media="(max-width: 767px)" sizes="calc(100vw - 40px)" className="mt-6 h-40 w-full md:hidden" />
        <div className="mt-10 flex flex-col gap-6 md:mt-14 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-lg text-muted-foreground">Professionally guided safaris across Namibia, with selected routes into Botswana and Zimbabwe.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/safaris" className="rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground">Explore Safaris</Link>
            <Link to="/tailor-made" className="rounded-lg border border-foreground/20 px-6 py-3.5 text-sm font-semibold">Plan Your Safari</Link>
          </div>
        </div>
      </section>

      <Section className="grid gap-10 border-t border-border/60 md:grid-cols-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay md:col-span-3">Proudly Namibian</p>
        <div className="md:col-span-9">
          <p className="text-2xl font-medium leading-snug md:text-4xl">{company.intro}</p>
          <Link to="/about" className="mt-8 inline-block border-b border-foreground pb-1 text-sm font-semibold">About Pelican</Link>
        </div>
      </Section>

      <Section className="pt-0 md:pt-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-4xl font-bold tracking-tight md:text-6xl">Safari <span className="text-clay">journeys</span></h2>
          <Link to="/safaris" className="text-sm font-semibold text-primary">All safaris →</Link>
        </div>
        <div className="mt-10 divide-y divide-border/70 border-y border-border/70">
          {safaris.map((s, i) => (
            <Link key={s.slug} to="/safaris/$slug" params={{ slug: s.slug }} className="group grid items-center gap-4 py-6 md:grid-cols-12 md:gap-8">
              <span className="text-sm text-muted-foreground md:col-span-1">0{i + 1}</span>
              <h3 className="text-2xl font-semibold tracking-tight md:col-span-4 md:text-3xl group-hover:text-clay">{s.name}</h3>
              <p className="text-muted-foreground md:col-span-3">{s.short}</p>
              <Strip src={s.image} shape={i % 2 ? "left" : "right"} className="h-20 w-full md:col-span-4 md:h-24" />
            </Link>
          ))}
        </div>
      </Section>

      <Section className="grid items-center gap-8 pt-0 md:grid-cols-2 md:gap-12 md:pt-0">
        <Photo name="savanna-plains-sunset" sizes="(min-width: 768px) 50vw, calc(100vw - 40px)" alt="Savanna plains at sunset" className="h-56 w-full rounded-r-[5rem] object-cover md:h-80" />
        <div className="min-w-0">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Where we <span className="text-clay">travel</span></h2>
          <ul className="mt-8">
            {destinations.slice(0, 7).map((d) => (
              <li key={d.slug} className="border-b border-border/60">
                <Link to="/destinations/$slug" params={{ slug: d.slug }} className="flex items-baseline justify-between gap-4 py-3.5 text-lg font-medium hover:text-clay">
                  {d.name}<span className="shrink-0 text-sm text-muted-foreground">{d.country}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/destinations" className="mt-8 inline-block text-sm font-semibold text-primary">All destinations →</Link>
        </div>
      </Section>

      <Section className="grid gap-10 md:grid-cols-12 md:items-center">
        <div className="md:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Tailor-made</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">A trip shaped around you.</h2>
          <p className="mt-6 text-lg text-muted-foreground">{company.specialty}</p>
          <Link to="/tailor-made" className="mt-8 inline-block rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground">Plan Your Safari</Link>
        </div>
        <Strip src="car-safari-scene" shape="left" className="h-48 w-full md:col-span-7 md:h-60" />
      </Section>

      <Section className="grid gap-10 border-t border-border/60 md:grid-cols-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay md:col-span-3">Your guide</p>
        <div className="md:col-span-9">
          <p className="text-2xl font-medium leading-snug md:text-4xl">{company.lead}</p>
          <p className="mt-6 text-lg text-muted-foreground">“{company.philosophy.split(".")[0]}.”</p>
        </div>
      </Section>

      <Section className="pt-0 md:pt-0">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-12 md:gap-4">
          <Photo name="leopard" sizes="(min-width: 768px) 50vw, calc(100vw - 40px)" alt="Leopard" className="h-40 w-full rounded-r-[5rem] object-cover md:col-span-7 md:h-72" />
          <Photo name="oryx" sizes="(min-width: 768px) 50vw, calc(100vw - 40px)" alt="Oryx" className="h-40 w-full object-cover md:col-span-5 md:h-72" />
          <Photo name="sea-lions" sizes="(min-width: 768px) 50vw, calc(100vw - 40px)" alt="Sea lions" className="h-40 w-full object-cover md:col-span-5 md:h-60" />
          <Photo name="quiver-tree-sunset" sizes="(min-width: 768px) 50vw, calc(100vw - 40px)" alt="Quiver tree at sunset" className="h-40 w-full rounded-l-[5rem] object-cover md:col-span-7 md:h-60" />
        </div>
        <Link to="/gallery" className="mt-8 inline-block text-sm font-semibold text-primary">View the gallery →</Link>
      </Section>

      <PlanCTA />
    </>
  );
}
