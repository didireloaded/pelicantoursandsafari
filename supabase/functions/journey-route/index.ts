import { createClient } from "npm:@supabase/supabase-js@2";
import { routeCoordinates } from "../_shared/journey-locations.ts";
import { mapboxRoute } from "../_shared/mapbox-route.ts";
Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") ?? "";
  const allowed = (Deno.env.get("ENQUIRY_ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim());
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  const reply = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers });
  if (!origin || !allowed.includes(origin)) return reply(403, "Origin not allowed");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply(405, "POST required");
  const mapboxToken = Deno.env.get("MAPBOX_ACCESS_TOKEN");
  const key = Deno.env.get("OPENROUTESERVICE_API_KEY");
  const salt = Deno.env.get("ENQUIRY_RATE_SALT");
  const address = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  if ((!mapboxToken && !key) || !salt || !address) return reply(503, "Routing unavailable");
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400, "Stops required");
    let raw = "";
    let size = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 4096) {
        await reader.cancel();
        return reply(413, "Too many stops");
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    const points = routeCoordinates(JSON.parse(raw).stops);
    const hash = [
      ...new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${address}`)),
      ),
    ]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await client.rpc("consume_routing_request", { network_hash: hash });
    if (error)
      return reply(
        error.message.includes("Rate limit") ? 429 : 503,
        "Routing temporarily unavailable",
      );
    if (mapboxToken) {
      try {
        const route = await mapboxRoute(points, mapboxToken);
        return new Response(JSON.stringify(route), { headers });
      } catch {
        return reply(502, "No driving route available");
      }
    }
    const response = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: { Authorization: key!, "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: points.map((p) => [p[1], p[0]]), instructions: false }),
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok) return reply(502, "No driving route available");
    const result = await response.json();
    const feature = result.features?.[0];
    if (
      feature?.geometry?.type !== "LineString" ||
      !Array.isArray(feature.geometry.coordinates) ||
      feature.properties?.segments?.length !== points.length - 1
    )
      return reply(502, "Invalid routing response");
    return new Response(
      JSON.stringify({
        points: feature.geometry.coordinates.map((p: number[]) => [p[1], p[0]]),
        provider: "OpenRouteService",
        legs: feature.properties.segments.map((s: { distance: number; duration: number }) => ({
          km: s.distance / 1000,
          minutes: s.duration / 60,
        })),
      }),
      { headers },
    );
  } catch {
    return reply(400, "Unable to calculate this journey");
  }
});
