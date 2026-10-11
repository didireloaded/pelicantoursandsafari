import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/site";

type OAuthResult = { data: { redirect_url?: string; redirect_to?: string; client?: { name?: string; redirect_uri?: string }; scope?: string; user?: { email?: string } } | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? (s["authorization_id"] as string) : "",
  }),
  head: () => ({ meta: [{ title: "Connect an assistant — Pelican" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("This authorization link is missing or invalid.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr } });
  },
  loaderDeps: ({ search }) => ({ id: search.authorization_id }),
  loader: async ({ deps }) => {
    const { data, error } = await oauth().getAuthorizationDetails(deps.id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    const { data: u } = await supabase.auth.getUser();
    return { client: data?.client?.name ?? "An app", redirectUri: data?.client?.redirect_uri ?? "", scope: data?.scope ?? "", email: u.user?.email ?? "" };
  },
  component: Consent,
  errorComponent: ({ error }) => <Section className="pt-32"><h1 className="font-display text-4xl">Could not load this request</h1><p className="mt-4 text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p></Section>,
});

const scopeLabel = (s: string) => s === "openid" ? "Confirm who you are" : s === "email" ? "Share your email address" : s === "profile" ? "Share your basic profile" : `Additional permission requested: ${s}`;

function Consent() {
  const d = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const decide = async (approve: boolean) => {
    setBusy(true); setError("");
    const { data, error: err } = approve ? await oauth().approveAuthorization(authorization_id) : await oauth().denyAuthorization(authorization_id);
    const target = data?.redirect_url ?? data?.redirect_to;
    if (err || !target) { setBusy(false); setError(err?.message ?? "No redirect was returned. Please try again."); return; }
    window.location.href = target;
  };
  return <Section className="pt-32">
    <div className="mx-auto max-w-lg">
      <p className="text-sm uppercase tracking-[0.2em] text-clay">Pelican team</p>
      <h1 className="mt-3 font-display text-4xl">Connect {d.client} to Pelican Tours and Safaris</h1>
      <p className="mt-6">This lets {d.client} use this app as you{d.email ? ` (${d.email})` : ""}.</p>
      {d.redirectUri && <p className="mt-2 text-sm text-muted-foreground">Returns to {d.redirectUri}</p>}
      <ul className="mt-6 divide-y divide-border border-y border-border text-sm">{d.scope.split(" ").filter(Boolean).map((s) => <li key={s} className="py-3">{scopeLabel(s)}</li>)}<li className="py-3">Read the safari catalogue; for staff accounts, view and update enquiries</li></ul>
      <p className="mt-4 text-sm text-muted-foreground">This does not bypass this app's permissions.</p>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <div className="mt-8 flex gap-3"><Button size="lg" disabled={busy} onClick={() => decide(true)}>Approve</Button><Button size="lg" variant="outline" disabled={busy} onClick={() => decide(false)}>Cancel connection</Button></div>
    </div>
  </Section>;
}
