import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Photo, Section, meta } from "@/components/site";
import { company, images } from "@/lib/pelican";

export const Route = createFileRoute("/gallery")({
  head: () => meta("Gallery", "Wildlife and landscape photography from Pelican Tours and Safaris journeys.", "leopard"),
  component: Gallery,
});

const spans = ["md:col-span-7 rounded-r-[5rem]", "md:col-span-5", "md:col-span-4", "md:col-span-8 rounded-l-[5rem]"];

function Gallery() {
  return (
    <>
      <PageHero eyebrow="Gallery" title="On the" accent="road" image="hyena" />
      <Section className="pt-0 md:pt-0">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-12 md:gap-4">
          {images.map((n, i) => (
            <Photo key={n} name={n} sizes="(min-width: 768px) 66vw, calc(100vw - 40px)" alt={n.replace(/-/g, " ")} loading="lazy" className={`h-40 w-full object-cover sm:h-48 md:h-72 ${spans[i % 4]}`} />
          ))}
        </div>
        <a href={company.album} target="_blank" rel="noreferrer" className="mt-10 inline-block border-b border-foreground pb-1 text-sm font-semibold">See the full photo album</a>
      </Section>
    </>
  );
}
