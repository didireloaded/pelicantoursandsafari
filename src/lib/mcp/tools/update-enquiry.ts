import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const statuses = ["new", "contacted", "building_itinerary", "quote_sent", "confirmed", "closed"] as const;

export default defineTool({
  name: "update_enquiry",
  title: "Update enquiry",
  description: "Move an enquiry to a new stage and/or replace its team notes. Pelican staff only.",
  inputSchema: {
    id: z.string().uuid().describe("Enquiry id."),
    status: z.enum(statuses).optional().describe("New pipeline stage."),
    staff_notes: z.string().max(8000).optional().describe("Replacement team notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, status, staff_notes }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    if (!status && staff_notes === undefined) throw new ToolError("Provide a status or staff_notes.");
    const patch: { status?: (typeof statuses)[number]; staff_notes?: string } = {};
    if (status) patch.status = status;
    if (staff_notes !== undefined) patch.staff_notes = staff_notes;
    const { data, error } = await supabaseForUser(ctx).from("enquiries").update(patch).eq("id", id).select("id, status, staff_notes");
    if (error) throw new ToolError(error.message);
    const row = data?.[0];
    if (!row) throw new ToolError("Enquiry not found or you do not have staff access.");
    return { content: [{ type: "text", text: JSON.stringify(row) }], structuredContent: { enquiry: { ...row } } };
  },
});
