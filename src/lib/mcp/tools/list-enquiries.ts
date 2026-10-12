import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const statuses = [
  "new",
  "contacted",
  "building_itinerary",
  "quote_sent",
  "confirmed",
  "closed",
] as const;

export default defineTool({
  name: "list_enquiries",
  title: "List enquiries",
  description: "List Safari Brief enquiries received by Pelican, newest first. Pelican staff only.",
  inputSchema: {
    status: z.enum(statuses).optional().describe("Only return enquiries in this stage."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of enquiries (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    let q = supabaseForUser(ctx)
      .from("enquiries")
      .select(
        "id, created_at, updated_at, status, name, email, phone, residence, contact_preference, safari_slug, brief, staff_notes",
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const rows = (data ?? []).map((r) => ({ ...r }));
    const text = rows.length
      ? JSON.stringify(rows)
      : "No enquiries visible. Your account may not have Pelican staff access.";
    return { content: [{ type: "text", text }], structuredContent: { enquiries: rows } };
  },
});
