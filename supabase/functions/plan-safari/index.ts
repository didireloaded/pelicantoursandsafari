import { createClient } from "npm:@supabase/supabase-js@2";
import { handlePlanRequest } from "./handler.ts";
const client = (token: string) =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
Deno.serve((request) =>
  handlePlanRequest(request, {
    allowedOrigins: (Deno.env.get("ENQUIRY_ALLOWED_ORIGINS") ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    ...(Deno.env.get("GOOGLE_AI_STUDIO_API_KEY")
      ? {
          gatewayKey: Deno.env.get("GOOGLE_AI_STUDIO_API_KEY"),
          endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          model: "gemini-2.5-flash",
        }
      : { gatewayKey: Deno.env.get("LOVABLE_API_KEY") }),
    authorize: async (token) => {
      const { data, error } = await client(token).auth.getUser(token);
      return !error && !!data.user;
    },
    consumeQuota: async (token) => {
      const { error } = await client(token).rpc("consume_traveller_plan_request");
      return error
        ? error.message.includes("Planning limit")
          ? "limited"
          : "unavailable"
        : "allowed";
    },
    fetchGateway: fetch,
  }),
);
