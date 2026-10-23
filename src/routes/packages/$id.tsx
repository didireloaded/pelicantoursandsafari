import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PUBLISHED_CONTENT_STALE_TIME, publishedContent } from "@/lib/site-content-api";
import { useQuery } from "@tanstack/react-query";
import { Section, PageHero, meta } from "@/components/site";
import { ContentPhoto } from "@/components/content-photo";
import { SafariPackageDetails } from "@/components/approved-safari-package";
import { getDestination } from "@/lib/pelican";
import type { PackageContent } from "@/lib/site-content";
export const Route = createFileRoute("/packages/$id")({
  loader: async ({ params }) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(params.id))
      throw notFound();
    const row = (await publishedContent("package")).find((item) => item.id === params.id);
    if (!row) throw notFound();
    return { publicPackage: row };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.publicPackage.data as PackageContent | undefined;
    return p
      ? meta(p.title, p.summary, p.image)
      : {
          meta: [
            { title: "Package unavailable — Pelican" },
            { name: "robots", content: "noindex" },
          ],
        };
  },
  errorComponent: ({ reset }) => (
    <Section>
      <h1 className="text-3xl">Package unavailable</h1>
      <p className="mt-4">Please check your connection and retry.</p>
      <button className="mt-5 underline" onClick={reset}>
        Retry
      </button>
    </Section>
  ),
  notFoundComponent: () => (
    <Section>
      <h1 className="text-3xl">Package not available</h1>
      <Link to="/safaris" className="mt-6 inline-block underline">
        Browse safaris
      </Link>
    </Section>
  ),
  component: PackagePage,
});
function PackagePage() {
  const { id } = Route.useParams();
  const initial = Route.useLoaderData().publicPackage;
  const query = useQuery({
    queryKey: ["site-content", "package", id],
    queryFn: async () => (await publishedContent("package")).find((item) => item.id === id) ?? null,
    initialData: initial,
    staleTime: PUBLISHED_CONTENT_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const row = query.data;
  const p = row?.data as PackageContent | undefined;
  if (query.isPending)
    return (
      <Section>
        <p role="status">Loading package…</p>
      </Section>
    );
  if (query.isError)
    return (
      <Section>
        <h1 className="text-3xl">Package unavailable</h1>
        <p className="mt-4">Please retry before making travel plans.</p>
        <button className="mt-5 underline" onClick={() => void query.refetch()}>
          Retry
        </button>
      </Section>
    );
  if (!p || !row)
    return (
      <Section>
        <h1 className="text-3xl">Package not available</h1>
        <Link to="/safaris" className="mt-6 inline-block underline">
          Browse safaris
        </Link>
      </Section>
    );
  return (
    <>
      <PageHero eyebrow="Pelican safari package" title={p.title} image={p.image} />
      <Section className="pt-0 md:pt-0">
        <p className="text-sm text-clay">
          {p.destinations.map((slug) => getDestination(slug)?.name).join(" · ")}
        </p>
        {p.coverPath && (
          <div className="mt-6">
            <ContentPhoto path={p.coverPath} alt={p.coverAlt} />
          </div>
        )}
        <p className="mt-6 max-w-3xl whitespace-pre-line text-xl leading-relaxed">
          {p.description}
        </p>
        <div className="mt-10">
          <SafariPackageDetails
            details={p.details}
            sourceUrl="https://pelicantoursandsafari.com/contact"
            updatedAt={row.updated_at}
          />
        </div>
        <div className="mt-10 border-t border-border pt-6">
          <p>
            Ask Pelican to confirm dates, availability and the final written quote. An enquiry is
            not a reservation.
          </p>
          <Link
            to="/tailor-made"
            search={{ package: row.id, destinations: p.destinations.join(",") }}
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground"
          >
            Enquire about this package
          </Link>
        </div>
      </Section>
    </>
  );
}
