import { describe, expect, it } from "vitest";
import { jsonLd, pageSeo, publicSeoPaths, siteOrigin, sitemapXml } from "../lib/seo";
import { destinations, safaris, stays } from "../lib/pelican";

describe("production SEO", () => {
  it("omits absolute metadata until a production origin is explicitly configured", () => {
    for (const origin of [undefined, "", "http://localhost:3000", "https://example.com/path", "https://user:pass@example.com", "https://example.com/?x=1"]) {
      expect(siteOrigin(origin)).toBeUndefined();
      expect(pageSeo("/", origin).canonical).toBeUndefined();
      expect(sitemapXml(origin)).toBeUndefined();
    }
  });
  it("canonicalizes only factual public pages and omits private and unknown routes", () => {
    expect(pageSeo("/safaris/big-five-etosha/", "https://example.com").canonical).toBe("https://example.com/safaris/big-five-etosha");
    for (const path of ["/auth", "/trips", "/proposals", "/dashboard", "/safaris/3daytours", "/missing"]) {
      expect(pageSeo(path, "https://example.com")).toMatchObject({ indexable: false, canonical: undefined, structuredData: [] });
    }
  });
  it("uses the complete real catalogue for sitemap entries without invented offers", () => {
    const xml = sitemapXml("https://example.com")!;
    for (const [prefix, entries] of [["safaris", safaris], ["destinations", destinations], ["stay", stays]] as const)
      for (const entry of entries) expect(xml).toContain(`https://example.com/${prefix}/${entry.slug}`);
    expect((xml.match(/<url>/g) ?? []).length).toBe(publicSeoPaths.length);
    const schema = pageSeo("/safaris/big-five-etosha", "https://example.com").structuredData;
    expect(schema.map((entry) => entry["@type"])).toEqual(["LocalBusiness", "TouristTrip"]);
    expect(JSON.stringify(schema)).not.toMatch(/Product|Offer|price|duration/);
    expect(JSON.stringify(schema)).toContain(safaris[0]!.overview);
  });
  it("escapes inline structured data so catalogue text cannot close its script", () => {
    const encoded = jsonLd({ text: "</script><script>alert(1)</script>&" });
    expect(encoded).not.toContain("<");
    expect(JSON.parse(encoded)).toEqual({ text: "</script><script>alert(1)</script>&" });
  });
});
