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
  name: "update_enquiry",
  title: "Update enquiry",
  description:
    "Move an enquiry to a new stage and/or replace its team notes. Pelican staff only. Read its latest updated_at before editing; stale updates are rejected.",
  inputSchema: {
    id: z.string().uuid().describe("Enquiry id."),
    expected_updated_at: z
      .string()
      .datetime({ offset: true })
      .describe(
        "Exact updated_at returned by list_enquiries. Preserve its precision; do not reformat.",
      ),
    status: z.enum(statuses).optional().describe("New pipeline stage."),
    staff_notes: z.string().max(8000).optional().describe("Replacement team notes."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ id, expected_updated_at, status, staff_notes }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    if (!status && staff_notes === undefined)
      throw new ToolError("Provide a status or staff_notes.");
    const patch: { status?: (typeof statuses)[number]; staff_notes?: string } = {};
    if (status) patch.status = status;
    if (staff_notes !== undefined) patch.staff_notes = staff_notes;
    const { data, error } = await supabaseForUser(ctx)
      .from("enquiries")
      .update(patch)
      .eq("id", id)
      .eq("updated_at", expected_updated_at)
      .select("id, status, staff_notes, updated_at");
    if (error) throw new ToolError(error.message);
    const row = data?.[0];
    if (!row)
      throw new ToolError(
        "Enquiry changed, is unavailable, or you lack staff access. Read the latest enquiry and review the changes before retrying; do not overwrite automatically.",
      );
    return {
      content: [{ type: "text", text: JSON.stringify(row) }],
      structuredContent: { enquiry: { ...row } },
    };
  },
});
