import { describe, expect, it } from "vitest";
import { blankPackage } from "../lib/site-content";
import { jsonLd, pageSeo, publicSeoPaths, siteOrigin, sitemapXml } from "../lib/seo";
import { company, destinations, safaris, stays, travelGuidance } from "../lib/pelican";

describe("production SEO", () => {
  it("generates the migrated production sitemap without private or obsolete origins", () => {
    const xml = sitemapXml("https://pelicantoursandsafari.com");
    expect(xml).toContain("<loc>https://pelicantoursandsafari.com/</loc>");
    expect(xml).toContain("<loc>https://pelicantoursandsafari.com/tailor-made</loc>");
    expect(xml).not.toContain("pelicanexplorer.com");
    expect(xml).not.toContain("<loc>https://pelicantoursandsafari.com/reset-password</loc>");
    expect(xml).not.toContain("<loc>https://pelicantoursandsafari.com/dashboard</loc>");
  });
  it("omits absolute metadata until a production origin is explicitly configured", () => {
    for (const origin of [undefined, "", "http://localhost:3000", "https://example.com/path", "https://user:pass@example.com", "https://example.com/?x=1"]) {
      expect(siteOrigin(origin)).toBeUndefined();
      expect(pageSeo("/", origin).canonical).toBeUndefined();
      expect(sitemapXml(origin)).toBeUndefined();
    }
  });
  it("canonicalizes only factual public pages and omits private and unknown routes", () => {
    expect(pageSeo("/safaris/big-five-etosha/", "https://example.com").canonical).toBe("https://example.com/safaris/big-five-etosha");
    for (const path of ["/auth", "/trips", "/proposals", "/dashboard", "/gallery", "/safaris/3daytours", "/missing"]) {
      expect(pageSeo(path, "https://example.com")).toMatchObject({ indexable: false, canonical: undefined, structuredData: [] });
    }
  });
  it("uses the complete real catalogue for sitemap entries without invented offers", () => {
    const xml = sitemapXml("https://example.com")!;
    for (const [prefix, entries] of [["safaris", safaris], ["destinations", destinations], ["stay", stays]] as const)
      for (const entry of entries) expect(xml).toContain(`https://example.com/${prefix}/${entry.slug}`);
    expect((xml.match(/<url>/g) ?? []).length).toBe(publicSeoPaths.length);
    const schema = pageSeo("/safaris/big-five-etosha", "https://example.com").structuredData;
    expect(schema.map((entry) => entry["@type"])).toEqual(["TravelAgency", "WebSite", "WebPage", "BreadcrumbList", "TouristTrip"]);
    expect(JSON.stringify(schema)).not.toMatch(/Product|Offer|price|duration/);
    expect(JSON.stringify(schema)).toContain(safaris[0]!.overview);
  });
  it("describes the real travel business with stable references and no fabricated ratings", () => {
    const schemas = pageSeo("/", "https://pelicantoursandsafari.com").structuredData;
    const business = schemas.find((node) => node["@type"] === "TravelAgency");
    expect(business).toMatchObject({ legalName: company.legal, email: company.email,
      address: { streetAddress: "10 Fabri Street, Pionierspark", addressLocality: "Windhoek", addressCountry: "NA" },
      contactPoint: company.contacts.map((contact) => expect.objectContaining({ name: contact.name, telephone: `+${contact.tel}` })),
    });
    expect(JSON.stringify(schemas)).not.toMatch(/aggregateRating|reviewCount|priceRange|SearchAction/);
    expect(schemas.find((node) => node["@type"] === "WebSite")).toMatchObject({
      publisher: { "@id": "https://pelicantoursandsafari.com/#business" },
    });
  });
  it("marks up only the questions and answers displayed in the travel guide", () => {
    const page = pageSeo("/travel-guide", "https://example.com").structuredData.find((node) => node["@type"] === "FAQPage");
    expect(page?.["mainEntity"]).toEqual(travelGuidance.faq.map((faq) => ({
      "@type": "Question", name: faq.title,
      acceptedAnswer: { "@type": "Answer", text: faq.body, citation: faq.source },
    })));
  });
  it("connects destination pages and factual breadcrumbs without treating stays as Pelican-owned hotels", () => {
    const destination = destinations[0]!;
    const nodes = pageSeo(`/destinations/${destination.slug}`, "https://example.com").structuredData;
    expect(nodes.find((node) => node["@type"] === "TouristDestination")).toMatchObject({ name: destination.name, containedInPlace: { name: destination.country } });
    expect(nodes.find((node) => node["@type"] === "BreadcrumbList")?.["itemListElement"]).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://example.com/" },
      { "@type": "ListItem", position: 2, name: "Safari Destinations", item: "https://example.com/destinations" },
      { "@type": "ListItem", position: 3, name: destination.name, item: `https://example.com/destinations/${destination.slug}` },
    ]);
    const stayNodes = pageSeo(`/stay/${stays[0]!.slug}`, "https://example.com").structuredData;
    expect(stayNodes.find((node) => node["@type"] === "WebPage")).toMatchObject({ name: stays[0]!.name });
    expect(stayNodes.some((node) => ["Hotel", "LodgingBusiness"].includes(String(node["@type"])))).toBe(false);
    expect(sitemapXml("https://example.com")).not.toContain("<loc>https://example.com/gallery</loc>");
  });
  it("escapes inline structured data so catalogue text cannot close its script", () => {
    const encoded = jsonLd({ text: "</script><script>alert(1)</script>&" });
    expect(encoded).not.toContain("<");
    expect(JSON.parse(encoded)).toEqual({ text: "</script><script>alert(1)</script>&" });
  });
});

it("indexes only a loaded published custom package with factual metadata", () => {
 const id="33333333-3333-4333-8333-333333333333";
 const path=`/packages/${id}`;
 expect(pageSeo(path,"https://example.com").indexable).toBe(false);
 const result=pageSeo(path,"https://example.com",{id,kind:"package",data:{...blankPackage(),title:"Etosha journey",summary:"Summary",description:"Approved description",destinations:["etosha"]},updated_at:"2026-10-22"});
 expect(result.canonical).toBe(`https://example.com${path}`);
 expect(result.structuredData.find(item=>item["@type"]==="TouristTrip")).toMatchObject({name:"Etosha journey",description:"Approved description"});
 expect(pageSeo("/admin","https://example.com").indexable).toBe(false);
});
