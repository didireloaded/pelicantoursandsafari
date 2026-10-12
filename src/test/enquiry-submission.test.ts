// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { handleSubmission } from "../../supabase/functions/submit-enquiry/handler";
const origin = "https://pelican.example";
const request = (body = "{}", overrides: Record<string, string> = {}) =>
  new Request("https://edge.example", {
    method: "POST",
    headers: { origin, "x-forwarded-for": "192.0.2.1", ...overrides },
    body,
  });
const services = () => ({
  allowedOrigins: [origin],
  rateSalt: "test-salt",
  submit: vi.fn(async (_payload: unknown, _hash: string) => ({
    data: "receipt-id",
    error: null as { message: string; code?: string } | null,
  })),
});
describe("Enquiry submission boundary", () => {
  it("rejects disallowed origins and oversized or malformed bodies before writing", async () => {
    const service = services();
    expect(
      (await handleSubmission(request("{}", { origin: "https://untrusted.example" }), service))
        .status,
    ).toBe(403);
    expect((await handleSubmission(request("x".repeat(16001)), service)).status).toBe(413);
    expect((await handleSubmission(request("{"), service)).status).toBe(400);
    expect(service.submit).not.toHaveBeenCalled();
  });
  it("returns a receipt only after the database confirms it", async () => {
    const service = services();
    const result = await handleSubmission(request(), service);
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ reference: "receipt-id" });
    expect(service.submit.mock.calls[0]?.[1]).toMatch(/^[0-9a-f]{64}$/);
  });
  it("distinguishes validation, rate limits and backend outages", async () => {
    for (const [message, status] of [
      ["Invalid email", 400],
      ["Rate limit reached", 429],
      ["database unavailable", 503],
    ] as const) {
      const service = services();
      service.submit.mockResolvedValue({ data: "", error: { message } });
      expect((await handleSubmission(request(), service)).status).toBe(status);
    }
    const service = services();
    service.submit.mockRejectedValue(new Error("Connection lost after commit"));
    const result = await handleSubmission(request(), service);
    expect(result.status).toBe(503);
    expect(await result.json()).not.toHaveProperty("reference");
  });
  it("fails closed without rate protection or a receipt", async () => {
    const service = services();
    expect((await handleSubmission(request(), { ...service, rateSalt: undefined })).status).toBe(
      503,
    );
    expect(service.submit).not.toHaveBeenCalled();
    service.submit.mockResolvedValue({ data: "", error: null });
    expect((await handleSubmission(request(), service)).status).toBe(503);
  });
});
