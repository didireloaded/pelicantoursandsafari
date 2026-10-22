import { createServerFn } from "@tanstack/react-start";
export const askWorkspaceHelp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { answerAdminQuestion } = await import("./admin-help.server");
    const { createClient } = await import("@supabase/supabase-js");
    const { loadWorkspace } = await import("./admin-workspace-api");
    const { assistantContext } = await import("./admin-workspace");
    const { company } = await import("./pelican");
    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = (token: string) =>
      createClient(url, key, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
    return answerAdminQuestion(data, getRequest(), {
      allowedOrigins: (
        process.env["ENQUIRY_ALLOWED_ORIGINS"] ?? "https://pelicantoursandsafari.com"
      )
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      ...(process.env["GOOGLE_AI_STUDIO_API_KEY"]
        ? {
            gatewayKey: process.env["GOOGLE_AI_STUDIO_API_KEY"],
            endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            model: "gemini-3.8-flash",
          }
        : { gatewayKey: process.env["LOVABLE_API_KEY"] }),
      authorize: async (token) => {
        const c = client(token);
        const user = await c.auth.getUser(token);
        if (user.error || !user.data.user) return false;
        const result = await c.rpc("can_manage_site");
        return !result.error && result.data === true;
      },
      consume: async (token) => {
        const result = await client(token).rpc("consume_admin_help");
        if (result.error) throw result.error;
      },
      context: async (token) => ({
        workspace: assistantContext(await loadWorkspace(client(token))),
        business: { name: company.name, intro: company.intro, hours: company.hours },
        sections: {
          Overview: "/admin",
          Clients: "/admin/clients",
          Reservations: "/admin/bookings",
          Analytics: "/admin/analytics",
          Packages: "/admin/packages",
          Gallery: "/admin/gallery",
          Enquiries: "/dashboard",
          Settings: "/admin/account",
        },
      }),
      fetchGateway: fetch,
    });
  });
