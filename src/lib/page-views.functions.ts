import { createServerFn } from "@tanstack/react-start";
export const recordView = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { publicSeoPaths } = await import("./seo");
    if (
      !data ||
      typeof data !== "object" ||
      !("path" in data) ||
      typeof data.path !== "string" ||
      data.path.length > 150
    )
      return { recorded: false };
    const path = data.path;
    if (
      !publicSeoPaths.includes(path) &&
      path !== "/gallery" &&
      !/^\/packages\/[0-9a-f-]{36}$/.test(path)
    )
      return { recorded: false };
    const req = getRequest();
    const origin = req.headers.get("origin") ?? "";
    const allowed = (process.env["ENQUIRY_ALLOWED_ORIGINS"] ?? "https://pelicantoursandsafari.com")
      .split(",")
      .map((v) => v.trim());
    if (
      !allowed.includes(origin) ||
      req.headers.get("dnt") === "1" ||
      req.headers.get("sec-gpc") === "1" ||
      process.env["ENQUIRY_TRUST_CLOUDFLARE_IP"] !== "true"
    )
      return { recorded: false };
    const ip = req.headers.get("cf-connecting-ip");
    const salt = process.env["ENQUIRY_RATE_SALT"];
    if (!ip || !salt) return { recorded: false };
    try {
      const bytes = new TextEncoder().encode(
        `${salt}:views:${new Date().toISOString().slice(0, 10)}:${ip}`,
      );
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const hash = Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0")).join(
        "",
      );
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const result = await supabaseAdmin.rpc("record_page_view", {
        _path: path,
        _network_hash: hash,
      });
      return { recorded: !result.error };
    } catch {
      return { recorded: false };
    }
  });
