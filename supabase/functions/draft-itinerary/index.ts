import { createClient } from "npm:@supabase/supabase-js@2";
import { handleDraftRequest } from "./handler.ts";
const userClient = (token: string) =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
Deno.serve((request) =>
  handleDraftRequest(request, {
    allowedOrigins: (Deno.env.get("ENQUIRY_ALLOWED_ORIGINS") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    gatewayKey: Deno.env.get("LOVABLE_API_KEY"),
    authorize: async (token) => {
      const client = userClient(token);
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) return "invalid";
      const role = await client.rpc("is_staff", { _user_id: data.user.id });
      if (role.error) throw role.error;
      return role.data ? "staff" : "traveller";
    },
    consumeQuota: async (token) => {
      const { error } = await userClient(token).rpc("consume_ai_draft_request");
      return error
        ? error.message.includes("Draft limit")
          ? "limited"
          : "unavailable"
        : "allowed";
    },
    fetchGateway: fetch,
  }),
);
