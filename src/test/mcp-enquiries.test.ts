// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("@lovable.dev/mcp-js", () => ({
  defineTool: (tool: unknown) => tool,
  ToolError: class extends Error {},
}));
const mock = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("../lib/mcp/supabase", () => ({ supabaseForUser: mock.client }));
import update from "../lib/mcp/tools/update-enquiry";
import list from "../lib/mcp/tools/list-enquiries";
const context = { isAuthenticated: () => true };
// The mock exposes the tool definition so the real handler can be exercised without a cloud token.
const updateTool = update as unknown as {
  inputSchema: { expected_updated_at: { parse: (value: unknown) => string } };
  handler: (input: unknown, ctx: unknown) => Promise<unknown>;
};
const listTool = list as unknown as { handler: (input: unknown, ctx: unknown) => Promise<unknown> };
describe("MCP enquiry version protection", () => {
  it("requires an exact version, rejects unauthenticated calls and never writes on them", async () => {
    expect(() => updateTool.inputSchema.expected_updated_at.parse(undefined)).toThrow();
    await expect(updateTool.handler({}, { isAuthenticated: () => false })).rejects.toThrow(
      "Not authenticated",
    );
    expect(mock.client).not.toHaveBeenCalled();
  });
  it("filters writes by the supplied timestamp and refuses a stale edit", async () => {
    const select = vi.fn().mockResolvedValue({ data: [], error: null });
    const query = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select };
    mock.client.mockReturnValue({ from: () => query });
    const version = "2026-10-12T03:00:00.123456+00:00";
    expect(updateTool.inputSchema.expected_updated_at.parse(version)).toBe(version);
    await expect(
      updateTool.handler({ id: "id", expected_updated_at: version, status: "contacted" }, context),
    ).rejects.toThrow("review the changes before retrying");
    expect(query.eq).toHaveBeenCalledWith("updated_at", version);
    expect(select).toHaveBeenCalledWith("id, status, staff_notes, updated_at");
  });
  it("lists the version required for a subsequent safe update", async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mock.client.mockReturnValue({ from: () => query });
    await listTool.handler({}, context);
    expect(query.select.mock.calls[0]?.[0]).toContain("updated_at");
  });
});
