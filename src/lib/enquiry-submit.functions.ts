import { createServerFn } from "@tanstack/react-start";
export const submitTripEnquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }) => {
    // Dynamic server-only imports keep service credentials and database transport
    // out of the client bundle. The handler validates before calling the RPC.
    const { getRequest } = await import("@tanstack/react-start/server");
    const { submitServerEnquiry } = await import("./enquiry-submit.server");
    const receipt = await submitServerEnquiry(data, getRequest(), {
      trustedCloudflareIngress: process.env["ENQUIRY_TRUST_CLOUDFLARE_IP"] === "true",
      allowedOrigins: (process.env["ENQUIRY_ALLOWED_ORIGINS"] ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      rateSalt: process.env["ENQUIRY_RATE_SALT"],
      databaseUrl: process.env["SUPABASE_URL"],
      serviceKey: process.env["SUPABASE_SERVICE_ROLE_KEY"],
    });
    if (receipt.reference) {
      // Best-effort emails after the enquiry is safely stored; failures are
      // logged and never block the traveller's receipt.
      const { sendEnquiryEmails } = await import("./enquiry-emails.server");
      const emails = await sendEnquiryEmails(data, receipt.reference);
      if (!emails.traveller.sent || !emails.pelican.sent) {
        console.error("Enquiry emails incomplete:", emails);
      }
    }
    return receipt;
  });
