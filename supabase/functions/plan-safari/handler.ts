import {
  compileTravellerPlan,
  plannerSchema,
  travellerGatewayBody,
} from "../_shared/traveller-itinerary.ts";
type Services = {
  allowedOrigins: string[];
  gatewayKey?: string | undefined;
  authorize: (token: string) => Promise<boolean>;
  consumeQuota: (token: string) => Promise<"allowed" | "limited" | "unavailable">;
  fetchGateway: typeof fetch;
  endpoint?: string;
  model?: string;
};
export async function handlePlanRequest(request: Request, services: Services): Promise<Response> {
  const origin = request.headers.get("origin") ?? "";
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": services.allowedOrigins.includes(origin) ? origin : "",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  const fail = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers });
  if (!origin || !services.allowedOrigins.includes(origin)) return fail(403, "Origin not allowed.");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return fail(405, "POST required.");
  const token = /^Bearer (\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return fail(401, "Sign in to generate your safari plan.");
  try {
    if (!(await services.authorize(token)))
      return fail(401, "Your session has expired. Sign in again.");
    const reader = request.body?.getReader();
    if (!reader) return fail(400, "Travel preferences required.");
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) {
        await reader.cancel();
        return fail(413, "Travel preferences are too long.");
      }
      chunks.push(value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    let input;
    try {
      input = plannerSchema.parse(JSON.parse(new TextDecoder().decode(body)));
    } catch {
      return fail(
        400,
        "Choose a destination, valid dates within 30 days, interests and a positive NAD budget.",
      );
    }
    if (!services.gatewayKey)
      return fail(
        503,
        "AI planning is not enabled yet. You can still use the safari quiz or send Pelican a brief.",
      );
    const quota = await services.consumeQuota(token);
    if (quota === "limited")
      return fail(429, "Your planning limit has been reached. Try again later.");
    if (quota !== "allowed") return fail(503, "AI planning is temporarily unavailable.");
    const response = await services.fetchGateway(
      services.endpoint ?? "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${services.gatewayKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...travellerGatewayBody(input),
          ...(services.model ? { model: services.model } : {}),
        }),
        signal: AbortSignal.timeout(45000),
      },
    );
    if (response.status === 429) return fail(429, "AI planning is busy. Try again later.");
    if (!response.ok) return fail(503, "AI planning is temporarily unavailable. Please try later.");
    try {
      const result = await response.json();
      const choice = result.choices?.[0];
      if (
        choice?.finish_reason !== "stop" ||
        typeof choice.message?.content !== "string" ||
        choice.message.content.length > 16000
      )
        throw new Error("Incomplete output");
      return new Response(
        JSON.stringify({ plan: compileTravellerPlan(input, JSON.parse(choice.message.content)) }),
        { headers },
      );
    } catch {
      return fail(502, "The AI response could not be verified. Please try again.");
    }
  } catch {
    return fail(503, "AI planning is temporarily unavailable. Please try again.");
  }
}
