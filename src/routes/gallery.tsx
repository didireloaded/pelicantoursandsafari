import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section, meta } from "@/components/site";
import { company, images, img } from "@/lib/pelican";

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
        <div className="grid gap-3 md:grid-cols-12 md:gap-4">
          {images.map((n, i) => (
            <img key={n} src={img(n)} alt={n.replace(/-/g, " ")} loading="lazy" className={`h-64 w-full object-cover md:h-96 ${spans[i % 4]}`} />
          ))}
        </div>
        <a href={company.album} target="_blank" rel="noreferrer" className="mt-10 inline-block border-b border-foreground pb-1 text-sm font-semibold">See the full photo album</a>
      </Section>
    </>
  );
}
