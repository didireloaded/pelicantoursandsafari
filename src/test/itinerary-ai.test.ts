// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import {
  compileDraft,
  gatewayDraftBody,
  validateDraftInput,
} from "../../supabase/functions/_shared/itinerary-draft";
import { handleDraftRequest } from "../../supabase/functions/draft-itinerary/handler";
const input = {
  brief: "Two days of wildlife and culture at a relaxed pace.",
  days: 2,
  details: [
    "Windhoek city visit; overnight in Windhoek, supplier to confirm.",
    "Etosha wildlife drive; overnight and transfer to confirm.",
  ],
};
const response = () =>
  new Response(
    JSON.stringify({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify({ days: [{ detail_ids: [2] }, { detail_ids: [1] }] }),
          },
        },
      ],
    }),
    { status: 200 },
  );
const request = (
  body: unknown = input,
  token = "staff-token",
  origin = "https://pelican.example",
) =>
  new Request("https://functions.example/draft-itinerary", {
    method: "POST",
    headers: { origin, Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
function services() {
  return {
    allowedOrigins: ["https://pelican.example"],
    gatewayKey: "test-only-key",
    authorize: vi.fn(async (_token: string): Promise<"staff" | "traveller" | "invalid"> => "staff"),
    consumeQuota: vi.fn(
      async (_token: string): Promise<"allowed" | "limited" | "unavailable"> => "allowed",
    ),
    fetchGateway: vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => response()),
  };
}
describe("Source-bound AI itinerary drafting", () => {
  it("only compiles the supplied details and rejects new commercial fields or detail IDs", () => {
    expect(compileDraft(input, { days: [{ detail_ids: [2] }, { detail_ids: [1] }] })).toBe(
      `Day 1\n${input.details[1]}\n\nDay 2\n${input.details[0]}`,
    );
    for (const result of [
      { days: [{ detail_ids: [1] }, { detail_ids: [2] }], total: 100, deposit: "50%" },
      { days: [{ detail_ids: [1], text: "Pay $100" }, { detail_ids: [2] }] },
      { days: [{ detail_ids: [1] }, { detail_ids: [3] }] },
      { days: [{ detail_ids: [1] }, { detail_ids: [1] }] },
      { days: [{ detail_ids: [1] }] },
    ])
      expect(() => compileDraft(input, result)).toThrow();
  });
  it("bounds request size and removes labelled contact data before model use", () => {
    const cleaned = validateDraftInput({
      ...input,
      brief:
        "Name: Test traveller\nEmail: private@example.com\nPhone: +264 81 000 0000\nMobility/accessibility: health details\nInterests: Wildlife and culture",
    });
    const sent = JSON.stringify(gatewayDraftBody(cleaned));
    expect(sent).not.toContain("private@example.com");
    expect(sent).not.toContain("Test traveller");
    expect(sent).not.toContain("health details");
    expect(sent).toContain("Wildlife and culture");
    expect(() => validateDraftInput({ ...input, details: ["one"], days: 2 })).toThrow();
    expect(() => validateDraftInput({ ...input, brief: "x".repeat(8001) })).toThrow();
  });
  it("requires verified staff access and an allowed origin before spending credits", async () => {
    const s = services();
    s.authorize.mockResolvedValue("traveller");
    expect((await handleDraftRequest(request(), s)).status).toBe(403);
    expect(s.fetchGateway).not.toHaveBeenCalled();
    expect(s.consumeQuota).not.toHaveBeenCalled();
    s.authorize.mockResolvedValue("invalid");
    expect((await handleDraftRequest(request(), s)).status).toBe(401);
    expect(
      (await handleDraftRequest(request(input, "staff-token", "https://evil.example"), s)).status,
    ).toBe(403);
  });
  it("returns a useful draft through Lovable without exposing the gateway key", async () => {
    const s = services();
    const result = await handleDraftRequest(request(), s);
    expect(result.status).toBe(200);
    const body = await result.text();
    expect(body).toContain("Day 1");
    expect(body).toContain("Etosha");
    expect(body).not.toContain("test-only-key");
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(s.fetchGateway.mock.calls[0]?.[0]).toBe(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
    );
  });
  it("fails closed for missing credentials, quota exhaustion and unverified AI output", async () => {
    const s = services();
    expect((await handleDraftRequest(request(), { ...s, gatewayKey: undefined })).status).toBe(503);
    expect(s.consumeQuota).not.toHaveBeenCalled();
    s.consumeQuota.mockResolvedValue("limited");
    expect((await handleDraftRequest(request(), s)).status).toBe(429);
    expect(s.fetchGateway).not.toHaveBeenCalled();
    s.consumeQuota.mockResolvedValue("allowed");
    s.fetchGateway.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "stop",
              message: {
                content: JSON.stringify({
                  days: [{ detail_ids: [1] }, { detail_ids: [2] }],
                  deposit: "50%",
                }),
              },
            },
          ],
        }),
      ),
    );
    expect((await handleDraftRequest(request(), s)).status).toBe(502);
  });
  it("handles exhausted credits and truncated model output without applying a partial draft", async () => {
    const s = services();
    s.fetchGateway.mockResolvedValue(new Response("{}", { status: 402 }));
    expect((await handleDraftRequest(request(), s)).status).toBe(402);
    s.fetchGateway.mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ finish_reason: "length", message: { content: "{}" } }] }),
      ),
    );
    expect((await handleDraftRequest(request(), s)).status).toBe(502);
  });
});
