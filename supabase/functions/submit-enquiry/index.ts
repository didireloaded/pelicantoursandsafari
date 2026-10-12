import { createClient } from "npm:@supabase/supabase-js@2";
import { handleSubmission } from "./handler.ts";

Deno.serve((request: Request) =>
  handleSubmission(request, {
    allowedOrigins: (Deno.env.get("ENQUIRY_ALLOWED_ORIGINS") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    rateSalt: Deno.env.get("ENQUIRY_RATE_SALT"),
    submit: async (payload, networkHash) => {
      const client = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      return await client.rpc("submit_enquiry", { payload, network_hash: networkHash });
    },
  }),
);
