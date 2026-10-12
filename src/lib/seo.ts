import { company, destinations, getSafari, img, safaris, stays } from "./pelican.ts";

/** Set VITE_SITE_ORIGIN to the verified public HTTPS origin at build time.
 * Without it, absolute canonical URLs, JSON-LD and the sitemap are omitted.
 * Preview/request origins are deliberately never inferred as production URLs.
 */
export function siteOrigin(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
      url.pathname !== "/" || url.search || url.hash ||
      url.hostname === "localhost" || !url.hostname.includes(".") ||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(url.hostname)) return undefined;
    return url.origin;
  } catch { return undefined; }
}

export const publicSeoPaths = [
  "/", "/about", "/contact", "/gallery", "/tailor-made", "/travel-guide",
  "/safaris", "/destinations", "/stay",
  ...safaris.map(({ slug }) => `/safaris/${slug}`),
  ...destinations.map(({ slug }) => `/destinations/${slug}`),
  ...stays.map(({ slug }) => `/stay/${slug}`),
];

export function pageSeo(pathname: string, configuredOrigin: unknown) {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const indexable = publicSeoPaths.includes(path);
  const origin = siteOrigin(configuredOrigin);
  const canonical = indexable && origin ? `${origin}${path}` : undefined;
  const business = origin ? {
    "@context": "https://schema.org", "@type": "LocalBusiness",
    "@id": `${origin}/#business`, name: company.name, url: `${origin}/`,
    description: company.intro, email: company.email,
    telephone: `+${company.contacts[0]?.tel ?? ""}`,
    address: { "@type": "PostalAddress", streetAddress: `${company.address[0]}, ${company.address[1]}`,
      addressLocality: company.address[2], addressCountry: "NA" },
    sameAs: [company.facebook],
  } : undefined;
  const safari = path.startsWith("/safaris/") ? getSafari(path.slice("/safaris/".length)) : undefined;
  const trip = canonical && safari && business ? {
    "@context": "https://schema.org", "@type": "TouristTrip", name: safari.name,
    description: safari.overview, image: new URL(img(safari.image), origin).href, url: canonical,
    provider: { "@id": business["@id"] },
  } : undefined;
  return { indexable, canonical, structuredData: indexable && business ? [business, ...(trip ? [trip] : [])] : [] };
}

/** Escape script-breaking text even if future catalogue content includes HTML. */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function sitemapXml(configuredOrigin: unknown): string | undefined {
  const origin = siteOrigin(configuredOrigin);
  if (!origin) return undefined;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicSeoPaths.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join("\n")}\n</urlset>\n`;
}
