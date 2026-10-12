import { handleSubmission } from "../../supabase/functions/submit-enquiry/handler";
import { enquiryInput, type EnquiryReceipt } from "./enquiry-input";
type Config = {
  trustedCloudflareIngress?: boolean;
  allowedOrigins: string[];
  rateSalt?: string | undefined;
  databaseUrl?: string | undefined;
  serviceKey?: string | undefined;
};
/** Same protected RPC/idempotency/rate-limit contract as the Edge entry point.
 * cf-connecting-ip must be overwritten by the trusted Cloudflare ingress.
 * Missing ingress identity fails closed; never accept it in submitted form data.
 */
export async function submitServerEnquiry(
  data: unknown,
  incoming: Request,
  config: Config,
  fetchDatabase: typeof fetch = fetch,
): Promise<EnquiryReceipt> {
  const parsed = enquiryInput.safeParse(data);
  if (!parsed.success) return { error: "Please check your enquiry details." };
  const address = incoming.headers.get("cf-connecting-ip")?.trim();
  const origin = incoming.headers.get("origin") ?? "";
  if (!origin || !config.allowedOrigins.includes(origin))
    return { error: "Submission origin is not allowed." };
  if (
    !config.trustedCloudflareIngress ||
    !address ||
    !config.rateSalt ||
    !config.databaseUrl ||
    !config.serviceKey
  )
    return {
      error:
        "Submission unavailable. Your brief has not been confirmed; please retry or contact Pelican.",
    };
  let endpoint: URL;
  try {
    endpoint = new URL("/rest/v1/rpc/submit_enquiry", config.databaseUrl);
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password)
      throw new Error("Invalid backend");
  } catch {
    return { error: "Submission unavailable. Please contact Pelican." };
  }
  const body = JSON.stringify(parsed.data);
  if (new TextEncoder().encode(body).byteLength > 16000)
    return { error: "Enquiry too large. Please shorten your brief." };
  const request = new Request(incoming.url, {
    method: "POST",
    headers: { origin, "x-forwarded-for": address },
    body,
  });
  const response = await handleSubmission(request, {
    allowedOrigins: config.allowedOrigins,
    rateSalt: config.rateSalt,
    submit: async (payload, networkHash) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        apikey: config.serviceKey!,
      };
      if (!config.serviceKey!.startsWith("sb_secret_"))
        headers["Authorization"] = `Bearer ${config.serviceKey}`;
      const result = await fetchDatabase(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ payload, network_hash: networkHash }),
        signal: AbortSignal.timeout(15000),
      });
      const value = await result.json();
      return result.ok
        ? { data: value, error: null }
        : {
            data: null,
            error: {
              message:
                typeof value?.message === "string" ? value.message : "Submission unavailable",
              code: value?.code,
            },
          };
    },
  });
  const value = await response.json();
  if (
    response.ok &&
    typeof value.reference === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.reference)
  )
    return { reference: value.reference };
  return {
    error:
      typeof value.error === "string"
        ? value.error
        : "Receipt unavailable. Retry the same brief to check its receipt.",
  };
}
