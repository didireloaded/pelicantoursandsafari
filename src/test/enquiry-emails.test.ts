import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit tests for the Resend sender used by enquiry emails. Fetch is mocked;
// no network calls and no real credentials involved.
const ENV_KEY = "RESENDER_API_KEY";

describe("sendResendEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv(ENV_KEY, "test-key-not-real");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const load = () => import("../lib/email-templates/resend");

  it("reports a missing key without calling the API", async () => {
    vi.stubEnv(ENV_KEY, "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { sendResendEmail } = await load();
    const result = await sendResendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>", text: "x" });
    expect(result).toEqual({ sent: false, reason: "key_missing" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces provider errors instead of throwing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"message":"forbidden"}', { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);
    const { sendResendEmail } = await load();
    const result = await sendResendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>", text: "x" });
    expect(result).toEqual({ sent: false, reason: "provider_error", status: 403 });
  });

  it("sends with the Pelican sender name and reports success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"id":"abc"}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { sendResendEmail } = await load();
    const result = await sendResendEmail({ to: "traveller@example.com", subject: "We received your safari enquiry", html: "<p>x</p>", text: "x", idempotencyKey: "enquiry/test/pelican" });
    expect(result).toEqual({ sent: true });
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("fetch was not called");
    const [url, init] = call;
    expect(url).toBe("https://api.resend.com/emails");
    expect(new Headers(init.headers).get("Idempotency-Key")).toBe("enquiry/test/pelican");
    const body = JSON.parse(String(init.body));
    expect(body.from).toBe("Pelican Tours and Safari <enquiries@pelicantoursandsafari.com>");
    expect(body.to).toEqual(["traveller@example.com"]);
  });
});
