// Run before Vite build; pass --mode development for build:dev.
// Node 22: node --experimental-strip-types scripts/seo-build.ts
import { loadEnv } from "vite";
import { writeFile, rm } from "node:fs/promises";
import { sitemapXml, siteOrigin } from "../src/lib/seo.ts";
const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex >= 0 ? process.argv[modeIndex + 1] ?? "production" : "production";
const env = loadEnv(mode, process.cwd(), "VITE_");
// The published domain is explicit; never infer it from a preview/request host.
const origin = siteOrigin(process.env["VITE_SITE_ORIGIN"] ?? env["VITE_SITE_ORIGIN"]) ?? "https://pelicantoursandsafari.com";
const sitemap = sitemapXml(origin);
const robots = `User-agent: *\nAllow: /\nDisallow: /auth\nDisallow: /reset-password\nDisallow: /.lovable/\nDisallow: /dashboard\nDisallow: /trips\nDisallow: /proposals\nDisallow: /content-manage\nDisallow: /shortlist\nDisallow: /journey\nDisallow: /match\n${origin ? `\nSitemap: ${origin}/sitemap.xml\n` : ""}`;
await writeFile(new URL("../public/robots.txt", import.meta.url), robots);
if (sitemap) await writeFile(new URL("../public/sitemap.xml", import.meta.url), sitemap);
else {
  await rm(new URL("../public/sitemap.xml", import.meta.url), { force: true });
  console.info("SEO: sitemap/canonicals omitted until VITE_SITE_ORIGIN is configured with the verified production HTTPS origin.");
}
