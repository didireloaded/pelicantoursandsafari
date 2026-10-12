type SubmissionServices = {
  allowedOrigins: string[];
  rateSalt?: string | undefined;
  submit: (
    payload: unknown,
    networkHash: string,
  ) => Promise<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
};

export async function handleSubmission(
  request: Request,
  services: SubmissionServices,
): Promise<Response> {
  const allowed = services.allowedOrigins;
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
    let raw: string;
    try {
      raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return reply(400, { error: "Invalid enquiry" });
    }
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return reply(400, { error: "Invalid enquiry" });
    }
    const address = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
    if (!services.rateSalt || !address) return reply(503, { error: "Submission unavailable" });
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${services.rateSalt}:${address}`),
    );
    const networkHash = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const { data, error } = await services.submit(body, networkHash);
    if (error) {
      if (error.message.includes("Rate limit"))
        return reply(429, { error: "Too many enquiries. Please try again later." });
      const invalid =
        /Invalid (enquiry|email|safari)|Request changed/.test(error.message) ||
        error.code === "22P02";
      return reply(invalid ? 400 : 503, {
        error: invalid
          ? "Check your enquiry details."
          : "Submission unavailable. Retry the same brief to check its receipt.",
      });
    }
    if (typeof data !== "string" || !data)
      return reply(503, { error: "Receipt unavailable. Retry the same brief." });
    return reply(200, { reference: data });
  } catch {
    return reply(503, {
      error: "Submission unavailable. Retry the same brief to check its receipt.",
    });
  }
}
