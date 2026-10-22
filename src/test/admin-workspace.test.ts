import { describe, it, expect, vi } from "vitest";
import {
  assistantContext,
  blankWorkspace,
  bookingSchema,
  tripEnd,
  periodSummary,
  type AdminTrip,
} from "@/lib/admin-workspace";
import { answerAdminQuestion } from "@/lib/admin-help.server";
const trip: AdminTrip = {
  id: "t",
  client_id: "c",
  traveller_id: null,
  title: "Private guest trip",
  starts_on: "2026-10-31",
  status: "confirmed",
  stops: [{ destination: "etosha", nights: 2 }],
  total_nad: 1000,
  paid_nad: 100,
  created_at: "2026-10-01",
  updated_at: "2026-10-01",
};
describe("workspace calculations", () => {
  it("crosses month boundaries in UTC and counts only confirmed trip value", () => {
    expect(tripEnd(trip)).toBe("2026-11-02");
    expect(
      periodSummary(
        { ...blankWorkspace(), trips: [trip, { ...trip, status: "draft" }] },
        30,
        "2026-10-31",
      ).value,
    ).toBe(1000);
  });
  it("rejects impossible dates, invalid stops and overpayments", () => {
    const value = { ...trip };
    for (const key of ["id", "created_at", "updated_at"])
      delete (value as Record<string, unknown>)[key];
    expect(bookingSchema.safeParse({ ...value, starts_on: "2026-02-30" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...value, paid_nad: 2000 }).success).toBe(false);
    expect(
      bookingSchema.safeParse({ ...value, stops: [{ destination: "invented", nights: 1 }] })
        .success,
    ).toBe(false);
  });
  it("keeps private client identities out of helper context", () => {
    const context = JSON.stringify(
      assistantContext({
        ...blankWorkspace(),
        trips: [trip],
        clients: [
          {
            id: "secret-id",
            name: "Private Guest",
            email: "private@example.com",
            country: "Namibia",
            phone: "123",
            source: "Referral",
            notes: "Secret notes",
            avatar_path: null,
            archived: false,
            revision: 1,
            updated_at: "",
            created_at: "",
          },
        ],
      }),
    );
    expect(context).not.toMatch(
      /Private Guest|private@example|Secret notes|secret-id|Private guest trip/,
    );
  });
});
describe("staff help boundary", () => {
  const request = (origin = "https://pelicantoursandsafari.com") =>
    new Request("https://pelicantoursandsafari.com/help", {
      method: "POST",
      headers: { origin, authorization: "Bearer verified-session" },
    });
  const services = () => ({
    allowedOrigins: ["https://pelicantoursandsafari.com"],
    gatewayKey: "test-key",
    authorize: vi.fn(async () => true),
    consume: vi.fn(async () => {}),
    context: vi.fn(async () => ({ clients: 2 })),
    fetchGateway: vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ finish_reason: "stop", message: { content: "Two clients recorded." } }],
          }),
        ),
    ) as unknown as typeof fetch,
  });
  it("rejects wrong origin and unauthorized users before gateway access", async () => {
    const s = services();
    expect(
      (await answerAdminQuestion({ question: "Help" }, request("https://evil.example"), s)).error,
    ).toBeTruthy();
    expect(s.authorize).not.toHaveBeenCalled();
    s.authorize.mockResolvedValue(false);
    expect((await answerAdminQuestion({ question: "Help" }, request(), s)).error).toBeTruthy();
    expect(s.fetchGateway).not.toHaveBeenCalled();
  });
  it("returns checked plain text and fails closed on truncated responses", async () => {
    const s = services();
    expect((await answerAdminQuestion({ question: "Client count?" }, request(), s)).answer).toBe(
      "Two clients recorded.",
    );
    s.fetchGateway = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ finish_reason: "length", message: { content: "Incomplete" } }],
          }),
        ),
    ) as unknown as typeof fetch;
    expect((await answerAdminQuestion({ question: "Help" }, request(), s)).answer).toBeUndefined();
  });
});
