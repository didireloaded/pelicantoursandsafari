import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (request: Request) => {
  const allowed = (Deno.env.get("ENQUIRY_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = request.headers.get("origin") ?? "";
  const headers = {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
    "Content-Type": "application/json",
  };
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers });
  if (!allowed.includes(origin)) return reply(403, { error: "Origin not allowed" });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply(405, { error: "POST required" });
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400, { error: "Enquiry required" });
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 16000) {
        await reader.cancel();
        return reply(413, { error: "Enquiry too large" });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const body = JSON.parse(raw);
    const salt = Deno.env.get("ENQUIRY_RATE_SALT");
    const address = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
    if (!salt || !address) return reply(503, { error: "Submission unavailable" });
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${salt}:${address}`),
    );
    const networkHash = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await client.rpc("submit_enquiry", {
      payload: body,
      network_hash: networkHash,
    });
    if (error)
      return reply(error.message.includes("Rate limit") ? 429 : 400, {
        error: "Could not accept this enquiry. Check your details or try again later.",
      });
    return reply(200, { reference: data });
  } catch {
    return reply(400, { error: "Invalid enquiry" });
  }
});
