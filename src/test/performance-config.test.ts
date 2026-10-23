import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { APPROVED_TRAVEL_DETAILS_STALE_TIME } from "@/lib/approved-travel-details";
import {
  ADMIN_WORKSPACE_REFRESH_INTERVAL,
  ADMIN_WORKSPACE_STALE_TIME,
  loadWorkspace,
} from "@/lib/admin-workspace-api";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { PUBLISHED_CONTENT_STALE_TIME } from "@/lib/site-content-api";

describe("network refresh budgets", () => {
  it("keeps public editorial content fresh without polling open tabs", () => {
    expect(PUBLISHED_CONTENT_STALE_TIME).toBe(5 * 60_000);
    expect(APPROVED_TRAVEL_DETAILS_STALE_TIME).toBe(5 * 60_000);
  });

  it("refreshes the full admin workspace less often than its cache window", () => {
    expect(ADMIN_WORKSPACE_STALE_TIME).toBe(60_000);
    expect(ADMIN_WORKSPACE_REFRESH_INTERVAL).toBe(120_000);
    expect(ADMIN_WORKSPACE_REFRESH_INTERVAL).toBeGreaterThan(ADMIN_WORKSPACE_STALE_TIME);
  });

  it("loads only the tables needed by a focused admin screen", async () => {
    const from = vi.fn((_table: string) => {
      const chain = new Proxy(
        {},
        {
          get: (_target, property) =>
            property === "abortSignal" ? async () => ({ data: [], error: null }) : () => chain,
        },
      );
      return chain;
    });
    const client = { from } as unknown as SupabaseClient<Database>;

    await loadWorkspace(client, "follow-ups");
    expect(from.mock.calls.map(([table]) => table)).toEqual(["enquiries"]);

    from.mockClear();
    await loadWorkspace(client, "clients");
    expect(from.mock.calls.map(([table]) => table)).toEqual(["clients", "trips"]);
  });

  it("keeps versioned images and fonts in the browser cache", () => {
    const headers = readFileSync("public/_headers", "utf8");
    expect(headers).toContain("/images/*\n  Cache-Control: public, max-age=31536000, immutable");
    expect(headers).toContain("/fonts/*\n  Cache-Control: public, max-age=31536000, immutable");
  });
});
