import type { PublishedContent, PackageContent } from "./site-content";
import { company, destinations, getDestination, getSafari, getStay, img, safaris, stays, travelGuidance } from "./pelican.ts";

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
  "/", "/about", "/contact", "/tailor-made", "/travel-guide",
  "/safaris", "/destinations", "/stay",
  ...safaris.map(({ slug }) => `/safaris/${slug}`),
  ...destinations.map(({ slug }) => `/destinations/${slug}`),
  ...stays.map(({ slug }) => `/stay/${slug}`),
];

const pageNames: Record<string, string> = {
  "/": "Namibia Safaris & Guided Tours", "/about": "About Pelican", "/contact": "Contact Pelican",
  "/tailor-made": "Your Safari Brief", "/travel-guide": "Safari Travel Guide",
  "/safaris": "Safaris & Tours", "/destinations": "Safari Destinations", "/stay": "Places to Stay",
};

export function pageSeo(pathname: string, configuredOrigin: unknown, publishedPackage?: PublishedContent) {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  // Empty destination gallery albums are not search landing pages until photos exist.
  const custom = publishedPackage?.kind === "package" && path === `/packages/${publishedPackage.id}` ? publishedPackage.data as PackageContent : undefined;
  const indexable = publicSeoPaths.includes(path) || !!custom;
  const origin = siteOrigin(configuredOrigin);
  const canonical = indexable && origin ? `${origin}${path}` : undefined;
  const structuredData: Record<string, unknown>[] = [];
  if (!canonical || !origin) return { indexable, canonical, structuredData };
  const safari = path.startsWith("/safaris/") ? getSafari(path.slice("/safaris/".length)) : undefined;
  const destination = path.startsWith("/destinations/") ? getDestination(path.slice("/destinations/".length)) : undefined;
  const stay = path.startsWith("/stay/") ? getStay(path.slice("/stay/".length)) : undefined;
  const name = custom?.title ?? safari?.name ?? destination?.name ?? stay?.name ?? pageNames[path] ?? company.name;
  const businessId = `${origin}/#business`;
  const websiteId = `${origin}/#website`;
  const business = {
    "@context": "https://schema.org", "@type": "TravelAgency", "@id": businessId,
    name: company.name, legalName: company.legal, url: `${origin}/`,
    logo: `${origin}/pelican-logo.png`, description: company.intro, email: company.email,
    telephone: `+${company.contacts[0]?.tel ?? ""}`,
    address: { "@type": "PostalAddress", streetAddress: `${company.address[0]}, ${company.address[1]}`,
      addressLocality: company.address[2], addressCountry: "NA" },
    contactPoint: company.contacts.map((contact) => ({ "@type": "ContactPoint", name: contact.name,
      telephone: `+${contact.tel}`, contactType: "enquiries", email: company.email })),
    areaServed: [...new Set(destinations.map((place) => place.country))].map((country) => ({ "@type": "Country", name: country })),
    sameAs: [company.facebook],
  };
  const webPage: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": path === "/travel-guide" ? "FAQPage" : path === "/contact" ? "ContactPage" : path === "/about" ? "AboutPage" : "WebPage",
    "@id": `${canonical}#webpage`, url: canonical, name, inLanguage: "en",
    isPartOf: { "@id": websiteId }, publisher: { "@id": businessId },
  };
  if (path === "/travel-guide") webPage["mainEntity"] = travelGuidance.faq.map((faq) => ({
    "@type": "Question", name: faq.title,
    acceptedAnswer: { "@type": "Answer", text: faq.body, citation: faq.source },
  }));
  structuredData.push(business, {
    "@context": "https://schema.org", "@type": "WebSite", "@id": websiteId,
    url: `${origin}/`, name: company.name, publisher: { "@id": businessId }, inLanguage: "en",
  }, webPage);
  if (path !== "/") {
    const section = safari || custom ? "/safaris" : destination ? "/destinations" : stay ? "/stay" : undefined;
    const crumbs = [{ name: "Home", item: `${origin}/` },
      ...(section ? [{ name: pageNames[section], item: `${origin}${section}` }] : []),
      { name, item: canonical }];
    structuredData.push({ "@context": "https://schema.org", "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumbs`, itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem", position: index + 1, ...crumb,
      })) });
    webPage["breadcrumb"] = { "@id": `${canonical}#breadcrumbs` };
  }
  if (safari || custom) {
    webPage["mainEntity"] = { "@id": `${canonical}#trip` };
    structuredData.push({
      "@context": "https://schema.org", "@type": "TouristTrip", "@id": `${canonical}#trip`,
      name: custom?.title ?? safari!.name, description: custom?.description ?? safari!.overview, image: new URL(img(custom?.image ?? safari!.image), origin).href,
      url: canonical, provider: { "@id": businessId },
    });
  }
  if (destination) {
    webPage["mainEntity"] = { "@id": `${canonical}#destination` };
    structuredData.push({ "@context": "https://schema.org", "@type": "TouristDestination",
      "@id": `${canonical}#destination`, name: destination.name, url: canonical,
      ...(destination.name !== destination.country ? { containedInPlace: { "@type": "Country", name: destination.country } } : {}),
      ...(destination.note ? { description: destination.note } : {}),
    });
  }
  return { indexable, canonical, structuredData };
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
