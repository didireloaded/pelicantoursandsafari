import { compileDraft, gatewayDraftBody, validateDraftInput } from "../_shared/itinerary-draft.ts";
type Services = {
  allowedOrigins: string[];
  gatewayKey?: string | undefined;
  authorize: (token: string) => Promise<"staff" | "traveller" | "invalid">;
  consumeQuota: (token: string) => Promise<"allowed" | "limited" | "unavailable">;
  fetchGateway: typeof fetch;
};
export async function handleDraftRequest(request: Request, services: Services): Promise<Response> {
  const origin = request.headers.get("origin") ?? "";
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": services.allowedOrigins.includes(origin) ? origin : "",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  const error = (status: number, message: string) =>
    new Response(JSON.stringify({ error: message }), { status, headers });
  if (!origin || !services.allowedOrigins.includes(origin)) return error(403, "Origin not allowed");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return error(405, "POST required");
  const token = /^Bearer (\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return error(401, "Sign in before drafting an itinerary.");
  try {
    const role = await services.authorize(token);
    if (role === "invalid") return error(401, "Your session has expired. Sign in again.");
    if (role !== "staff") return error(403, "Staff access required.");
    if (!services.gatewayKey)
      return error(503, "Lovable AI must be enabled for this project before generating drafts.");
    const reader = request.body?.getReader();
    if (!reader) return error(400, "Safari Brief required.");
    let raw = "";
    let bytes = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 24000) {
        await reader.cancel();
        return error(413, "Brief and tour details are too long.");
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    let input;
    try {
      input = validateDraftInput(JSON.parse(raw));
    } catch (e) {
      return error(400, e instanceof Error ? e.message : "Invalid brief.");
    }
    const quota = await services.consumeQuota(token);
    if (quota === "limited") return error(429, "Draft limit reached. Please try later.");
    if (quota !== "allowed") return error(503, "Drafting is temporarily unavailable.");
    const upstream = await services.fetchGateway(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${services.gatewayKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gatewayDraftBody(input)),
        signal: AbortSignal.timeout(45000),
      },
    );
    if (upstream.status === 402)
      return error(402, "Your Lovable workspace needs AI credits to generate this draft.");
    if (upstream.status === 429) return error(429, "Lovable AI is busy. Please try later.");
    if (!upstream.ok)
      return error(502, "Lovable AI could not generate the draft. Please try again.");
    try {
      const result = await upstream.json();
      const choice = result.choices?.[0];
      if (
        choice?.finish_reason !== "stop" ||
        typeof choice.message?.content !== "string" ||
        choice.message.content.length > 16000
      )
        throw new Error("Incomplete AI response");
      const itinerary = compileDraft(input, JSON.parse(choice.message.content));
      return new Response(JSON.stringify({ itinerary }), { headers });
    } catch {
      return error(
        502,
        "The AI draft did not match your supplied details. Please retry or draft it manually.",
      );
    }
  } catch {
    return error(503, "Drafting is temporarily unavailable. Please try again.");
  }
}
