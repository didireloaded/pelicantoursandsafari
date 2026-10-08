import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/site";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Pelican staff sign in" }, { name: "description", content: "Sign in to the Pelican Tours and Safaris enquiry dashboard." }, { property: "og:title", content: "Pelican staff sign in" }, { property: "og:description", content: "Pelican enquiry dashboard sign in." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const field = "mt-2 w-full border-b border-foreground/25 bg-transparent py-3 outline-none focus:border-primary";
  const go = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message); else navigate({ to: "/dashboard" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
      setMsg(error ? error.message : "Check your email to confirm your account. An administrator must then grant staff access.");
    }
  };
  return <Section className="pt-32">
    <div className="mx-auto max-w-md">
      <p className="text-sm uppercase tracking-[0.2em] text-clay">Pelican team</p>
      <h1 className="mt-3 font-display text-5xl">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <form onSubmit={go} className="mt-10 space-y-6">
        <label className="block">Email<input type="email" required autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block">Password<input type="password" required minLength={8} autoComplete={mode === "in" ? "current-password" : "new-password"} className={field} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <Button type="submit" size="lg" className="w-full">{mode === "in" ? "Sign in" : "Create account"}</Button>
      </form>
      {msg && <p role="status" className="mt-6 text-sm text-muted-foreground">{msg}</p>}
      <Button variant="link" className="mt-6 px-0" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "New team member? Create an account" : "Already have an account? Sign in"}</Button>
    </div>
  </Section>;
}
