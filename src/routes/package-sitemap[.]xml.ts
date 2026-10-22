import { createFileRoute } from "@tanstack/react-router";
import { publishedContent } from "@/lib/site-content-api";
import { siteOrigin } from "@/lib/seo";
export const Route = createFileRoute("/package-sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const origin =
            siteOrigin(import.meta.env["VITE_SITE_ORIGIN"]) ?? "https://pelicantoursandsafari.com";
          const rows = await publishedContent("package");
          const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows
            .filter((row) => /^[0-9a-f-]{36}$/.test(row.id))
            .map((row) => `<url><loc>${origin}/packages/${row.id}</loc></url>`)
            .join("")}</urlset>`;
          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "no-store",
            },
          });
        } catch {
          return new Response("Sitemap temporarily unavailable", {
            status: 503,
            headers: { "Retry-After": "60", "Cache-Control": "no-store" },
          });
        }
      },
    },
  },
});
