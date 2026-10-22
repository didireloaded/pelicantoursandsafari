import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { oauthReturnPath } from "@/lib/oauth-return-path";
import { Section } from "@/components/site";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ next: oauthReturnPath(s["next"]) }),
  head: () => ({
    meta: [
      { title: "Sign in — Pelican" },
      {
        name: "description",
        content: "Sign in to your Pelican trips, private proposals or team dashboard.",
      },
      { property: "og:title", content: "Sign in — Pelican" },
      { property: "og:description", content: "Pelican traveller and team sign in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const traveller = ["/trips", "/proposals", "/match"].includes(next.split("?")[0] ?? "");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const field =
    "mt-2 w-full border-b border-foreground/25 bg-transparent py-3 outline-none focus:border-primary";
  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMsg("");
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMsg(error.message);
        else window.location.assign(next === "/" ? "/dashboard" : next);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${traveller ? next : "/dashboard"}`,
          },
        });
        setMsg(
          error
            ? error.message
            : traveller
              ? "Check your email to confirm your account, then sign in. Pelican will assign your trip or private proposal."
              : "Check your email to confirm your account. An administrator must then grant staff access.",
        );
      }
    } catch {
      setMsg("Sign-in could not be completed. Check your connection and try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const recover = async () => {
    if (lock.current) return;
    if (!email.trim()) {
      setMsg("Enter your email address above to request a recovery link.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setMsg("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMsg(
        "If an account exists for this address, a recovery email will arrive. Check your inbox and spam folder.",
      );
    } catch {
      setMsg("The recovery request could not be completed. Check your connection and try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const RETURN_KEY = "pelican_oauth_return";
  useEffect(() => {
    let cancelled = false;
    const stored = sessionStorage.getItem(RETURN_KEY);
    if (!stored) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled || !data.session) return;
      sessionStorage.removeItem(RETURN_KEY);
      const target = stored === "/" ? "/dashboard" : stored;
      window.location.assign(target);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const google = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMsg("");
    sessionStorage.setItem(RETURN_KEY, next);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) {
        sessionStorage.removeItem(RETURN_KEY);
        setMsg(result.error.message || "Google sign-in could not be started. Please try again.");
        return;
      }
      if (result.redirected) return;
      sessionStorage.removeItem(RETURN_KEY);
      window.location.assign(next === "/" ? "/dashboard" : next);
    } catch {
      sessionStorage.removeItem(RETURN_KEY);
      setMsg("Google sign-in could not be completed. Check your connection and try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
    <Section className="pt-32">
      <div className="mx-auto max-w-md">
        <p className="text-sm uppercase tracking-[0.2em] text-clay">
          {traveller ? "Pelican traveller" : "Pelican team"}
        </p>
        <h1 className="mt-3 font-display text-5xl">
          {mode === "in" ? "Sign in" : "Create account"}
        </h1>
        <form onSubmit={go} className="mt-10 space-y-6">
          <label className="block">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            Password
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              className={field}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={busy} size="lg" className="w-full">
            {mode === "in" ? "Sign in" : "Create account"}
          </Button>
        </form>
        {mode === "in" && (
          <Button variant="link" className="mt-6 px-0" disabled={busy} onClick={recover}>
            Forgot password?
          </Button>
        )}
        {msg && (
          <p role="status" className="mt-6 text-sm text-muted-foreground">
            {msg}
          </p>
        )}
        <Button
          variant="link"
          className="mt-6 px-0"
          disabled={busy}
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in"
            ? traveller
              ? "Create a traveller account"
              : "New team member? Create an account"
            : "Already have an account? Sign in"}
        </Button>
      </div>
    </Section>
  );
}
