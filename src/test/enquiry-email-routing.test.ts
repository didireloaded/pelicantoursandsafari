import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@/lib/email-templates/resend", () => ({ sendResendEmail: mocks.send }));
import { sendEnquiryEmails } from "@/lib/enquiry-emails.server";

const brief = {
  request_id: "d681bf88-3e53-4d09-b6a4-e243e112068f",
  name: "Routing test", email: "traveller@example.com", phone: null,
  residence: null, contact_preference: "Email", safari_slug: null, brief: "Synthetic routing test only",
};
afterEach(() => vi.clearAllMocks());
it("sends Pelican notifications to the client inbox and replies to the traveller", async () => {
  mocks.send.mockResolvedValue({ sent: true });
  const result = await sendEnquiryEmails(brief, "synthetic-reference");
  expect(result.pelican.sent).toBe(true);
  expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
    to: "info@pelicantoursandsafaris.com", replyTo: "traveller@example.com",
    subject: "New safari enquiry synthetic-reference — Routing test",
    html: expect.stringContaining("https://pelicantoursandsafari.com/dashboard"),
  }));
  expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
    to: "traveller@example.com", replyTo: "info@pelicantoursandsafaris.com",
  }));
});
it("still notifies the client for phone-only requests without an invalid reply address", async () => {
  mocks.send.mockResolvedValue({ sent: true });
  await sendEnquiryEmails({ ...brief, email: null, phone: "+264000000000", contact_preference: "Phone" }, "synthetic-reference");
  expect(mocks.send).toHaveBeenCalledTimes(1);
  expect(mocks.send.mock.calls[0]?.[0].to).toBe("info@pelicantoursandsafaris.com");
  expect(mocks.send.mock.calls[0]?.[0]).not.toHaveProperty("replyTo");
});
