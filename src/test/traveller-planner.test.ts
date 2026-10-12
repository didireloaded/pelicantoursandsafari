import { describe, expect, it, vi } from "vitest";
import {
  compileTravellerPlan,
  itineraryDays,
  plannerInterests,
  plannerSchema,
  travellerGatewayBody,
} from "../lib/traveller-itinerary";
import { handlePlanRequest } from "../../supabase/functions/plan-safari/handler";
const input = {
  destination: "etosha",
  start: "2099-02-01",
  end: "2099-02-02",
  budget: 10000,
  interests: [plannerInterests[0]!],
};
const output = {
  days: [
    { day: 1, safari: "big-five-etosha", interests: input.interests },
    { day: 2, safari: null, interests: [] },
  ],
};
const request = (body: unknown = input, token = "valid") =>
  new Request("https://edge.test", {
    method: "POST",
    headers: { origin: "https://site.test", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
const services = () => ({
  allowedOrigins: ["https://site.test"],
  gatewayKey: "test-only",
  authorize: vi.fn(async () => true),
  consumeQuota: vi.fn(async () => "allowed" as const),
  fetchGateway: vi.fn(
    async (_url: RequestInfo | URL, _options?: RequestInit) =>
      new Response(
        JSON.stringify({
          choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output) } }],
        }),
      ),
  ),
});
describe("traveller AI planner", () => {
  it("validates calendar dates, future dates, destination, interests and bounded trip length", () => {
    expect(plannerSchema.safeParse(input).success).toBe(true);
    for (const patch of [
      { start: "2099-02-30" },
      { start: "2020-01-01" },
      { end: "2099-01-31" },
      { end: "2099-03-05" },
      { budget: -1 },
      { interests: [] },
      { destination: "unknown" },
    ])
      expect(plannerSchema.safeParse({ ...input, ...patch }).success).toBe(false);
    expect(itineraryDays(input)).toBe(2);
  });
  it("renders catalogue facts, dates and flexible days while rejecting invented destinations or financial fields", () => {
    const result = compileTravellerPlan(input, output);
    expect(result.days[0]?.title).toBe("Etosha Wildlife Safari");
    expect(result.days[0]?.description).toContain("Buffalo are not naturally present");
    expect(result.days[1]?.date).toBe(input.end);
    for (const wrong of [
      { ...output, price: 50 },
      { days: [{ ...output.days[0], safari: "windhoek-city-tour" }, output.days[1]] },
      { days: [...output.days].reverse() },
      { days: [{ ...output.days[0], interests: ["invented"] }, output.days[1]] },
    ])
      expect(() => compileTravellerPlan(input, wrong)).toThrow();
  });
  it("never spends before authentication and validation, and fails closed without credentials or quota", async () => {
    const s = services();
    s.authorize.mockResolvedValueOnce(false);
    expect((await handlePlanRequest(request(), s)).status).toBe(401);
    expect(s.consumeQuota).not.toHaveBeenCalled();
    expect((await handlePlanRequest(request({ ...input, price: 12 }), s)).status).toBe(400);
    expect((await handlePlanRequest(request(), { ...s, gatewayKey: undefined })).status).toBe(503);
    expect(
      (await handlePlanRequest(request(), { ...s, consumeQuota: async () => "limited" })).status,
    ).toBe(429);
    expect(s.fetchGateway).not.toHaveBeenCalled();
  });
  it("returns a verified plan and sends only preferences/catalogue to the fixed gateway", async () => {
    const s = services();
    const response = await handlePlanRequest(request(), s);
    expect(response.status).toBe(200);
    expect((await response.json()).plan.days).toHaveLength(2);
    expect(s.fetchGateway.mock.calls[0]?.[0]).toBe(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
    );
    expect(JSON.stringify(travellerGatewayBody(input))).toContain("unverified affordability");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("rejects truncation, invalid AI output and oversized input without a misleading success", async () => {
    const s = services();
    s.fetchGateway.mockImplementationOnce(
      async () =>
        new Response(
          JSON.stringify({ choices: [{ finish_reason: "length", message: { content: "{}" } }] }),
        ),
    );
    expect((await handlePlanRequest(request(), s)).status).toBe(502);
    expect((await handlePlanRequest(request({ text: "x".repeat(5000) }), s)).status).toBe(413);
  });
});
