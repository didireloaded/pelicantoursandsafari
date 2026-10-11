import { defineTool } from "@lovable.dev/mcp-js";
import { safaris, destinations } from "@/lib/pelican";

export default defineTool({
  name: "list_safaris",
  title: "List safaris",
  description: "List Pelican's safari experiences with their overview and the destinations they visit.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const rows = safaris.map((s) => ({
      slug: s.slug,
      name: s.name,
      overview: s.overview,
      destinations: s.destinations.map((d) => destinations.find((x) => x.slug === d)?.name ?? d),
    }));
    return { content: [{ type: "text", text: JSON.stringify(rows) }], structuredContent: { safaris: rows } };
  },
});
