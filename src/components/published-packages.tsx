import { Link } from "@tanstack/react-router";
import { usePublishedContent } from "@/lib/site-content-api";
import type { PackageContent } from "@/lib/site-content";
import { getDestination } from "@/lib/pelican";
import { Strip } from "./site";
import { ContentPhoto } from "./content-photo";
import { SafariPackageSummary } from "./approved-safari-package";
export function PublishedPackages({
  country = "",
  destination = "",
  interest = "",
}: {
  country?: string;
  destination?: string;
  interest?: string;
}) {
  const query = usePublishedContent("package");
  const rows = (query.data ?? []).filter((row) => {
    const p = row.data as PackageContent;
    return (
      (!country || p.destinations.some((slug) => getDestination(slug)?.country === country)) &&
      (!destination || p.destinations.includes(destination)) &&
      (!interest || p.interests.includes(interest))
    );
  });
  return (
    <>
      {query.isError && (
        <p className="mt-6 text-sm" role="status">
          Additional packages could not be loaded.{" "}
          <button className="underline" onClick={() => void query.refetch()}>
            Retry
          </button>{" "}
          or contact Pelican.
        </p>
      )}
      {rows.map((row) => {
        const p = row.data as PackageContent;
        return (
          <article
            key={row.id}
            className="discovery-card group grid gap-6 border-t border-border/70 py-10 md:grid-cols-12 md:gap-10 md:py-14"
          >
            <div className="md:col-span-7">
              {p.coverPath ? (
                <ContentPhoto
                  path={p.coverPath}
                  alt={p.coverAlt}
                  className="h-48 w-full rounded-lg object-cover md:h-64"
                />
              ) : (
                <Strip src={p.image} shape="right" className="h-48 w-full md:h-64" />
              )}
            </div>
            <div className="md:col-span-5 md:self-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{p.title}</h2>
              <p className="mt-4 text-muted-foreground">{p.summary}</p>
              <p className="mt-4 text-sm">
                {p.destinations.map((slug) => getDestination(slug)?.name).join(" · ")}
              </p>
              <SafariPackageSummary details={p.details} />
              <Link
                to="/packages/$id"
                params={{ id: row.id }}
                className="mt-6 inline-block text-sm font-semibold text-primary"
              >
                View package →
              </Link>
            </div>
          </article>
        );
      })}
    </>
  );
}
