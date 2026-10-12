// @vitest-environment node
import { expect, it, vi } from "vitest";
import { submitServerEnquiry } from "../lib/enquiry-submit.server";
const id = "11111111-1111-4111-8111-111111111111";
const payload = {
  request_id: id,
  name: "Traveller",
  email: "traveller@example.test",
  phone: null,
  residence: null,
  contact_preference: "Email",
  safari_slug: null,
  brief: "Etosha enquiry",
};
const config = {
  trustedCloudflareIngress: true,
  allowedOrigins: ["https://site.test"],
  rateSalt: "test-salt",
  databaseUrl: "https://database.test",
  serviceKey: "sb_secret_test",
};
const request = (
  headers: Record<string, string> = {
    origin: "https://site.test",
    "cf-connecting-ip": "192.0.2.1",
  },
) => new Request("https://site.test/_serverFn/test", { method: "POST", headers });
it("uses the protected RPC with server-only credentials, salted network hash and unchanged retry UUID", async () => {
  const fetchDatabase = vi.fn(
    async (_url: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(id)),
  );
  for (let i = 0; i < 2; i++)
    expect(await submitServerEnquiry(payload, request(), config, fetchDatabase)).toEqual({
      reference: id,
    });
  const [url, init] = fetchDatabase.mock.calls[0]!;
  expect(String(url)).toBe("https://database.test/rest/v1/rpc/submit_enquiry");
  const headers = new Headers(init?.headers);
  expect(headers.get("apikey")).toBe(config.serviceKey);
  expect(headers.has("authorization")).toBe(false);
  const body = JSON.parse(String(init?.body));
  expect(body.payload.request_id).toBe(id);
  expect(body.network_hash).toMatch(/^[0-9a-f]{64}$/);
  expect(body.network_hash).not.toContain("192.0.2.1");
  expect(JSON.parse(String(fetchDatabase.mock.calls[1]?.[1]?.body))).toEqual(body);
});
it("rejects invalid fields, foreign origins, missing ingress identity and absent secrets before writing", async () => {
  const fetchDatabase = vi.fn();
  for (const [data, req, settings] of [
    [{ ...payload, staff_notes: "injected" }, request(), config],
    [
      payload,
      request({ origin: "https://attacker.test", "cf-connecting-ip": "192.0.2.1" }),
      config,
    ],
    [payload, request({ origin: "https://site.test", "x-forwarded-for": "forged" }), config],
    [payload, request(), { ...config, serviceKey: undefined }],
    [payload, request(), { ...config, trustedCloudflareIngress: false }],
  ] as const)
    expect(await submitServerEnquiry(data, req, settings, fetchDatabase)).toHaveProperty("error");
  expect(fetchDatabase).not.toHaveBeenCalled();
});
it("does not reveal database errors or claim receipt on failure, and returns actionable rate limits", async () => {
  const fetchDatabase = vi.fn(
    async () =>
      new Response(JSON.stringify({ message: "sensitive database connection details" }), {
        status: 500,
      }),
  );
  const failure = await submitServerEnquiry(payload, request(), config, fetchDatabase);
  expect(failure.error).toContain("Submission unavailable");
  expect(JSON.stringify(failure)).not.toContain("sensitive");
  expect(failure.reference).toBeUndefined();
  fetchDatabase.mockImplementationOnce(
    async () => new Response(JSON.stringify({ message: "Rate limit reached" }), { status: 400 }),
  );
  expect((await submitServerEnquiry(payload, request(), config, fetchDatabase)).error).toContain(
    "Too many enquiries",
  );
});
