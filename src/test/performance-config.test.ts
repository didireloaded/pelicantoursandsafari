import { describe, expect, it } from "vitest";
import { APPROVED_TRAVEL_DETAILS_STALE_TIME } from "@/lib/approved-travel-details";
import {
  ADMIN_WORKSPACE_REFRESH_INTERVAL,
  ADMIN_WORKSPACE_STALE_TIME,
} from "@/lib/admin-workspace-api";
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
});
