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
  const [resendUntil, setResendUntil] = useState(0);
  const [resendWaiting, setResendWaiting] = useState(false);
  useEffect(() => {
    if (!resendUntil) return;
    setResendWaiting(true);
    const timer = window.setTimeout(
      () => setResendWaiting(false),
      Math.max(0, resendUntil - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [resendUntil]);
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
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error)
          setMsg(
            error.code === "invalid_credentials" || /invalid.*credentials/i.test(error.message)
              ? "We couldn’t sign you in with that email and password. If you signed up with Google or Apple, use the same button above. Otherwise choose Forgot password? to reset your password."
              : error.code === "email_not_confirmed"
                ? "Confirm your email address using the message in your inbox before signing in."
                : "Sign-in could not be completed. Please retry or use Forgot password?.",
          );
        else window.location.assign(next === "/" ? "/admin" : next);
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${traveller ? next : "/admin"}`,
          },
        });
        setMsg(
          error
            ? error.message
            : traveller
              ? "Check your email to confirm your account, then sign in. Pelican will assign your trip or private proposal."
              : "Confirm your email, then sign in. Your access request goes to a Pelican administrator for approval.",
        );
      }
    } catch {
      setMsg("Sign-in could not be completed. Check your connection and try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const resendConfirmation = async () => {
    if (lock.current || Date.now() < resendUntil) return;
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setMsg("Enter a valid email address above to request a confirmation email.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setMsg("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: address,
        options: { emailRedirectTo: `${window.location.origin}${traveller ? next : "/admin"}` },
      });
      if (error) {
        if (error.status === 429 || error.code === "over_email_send_rate_limit") {
          setResendUntil(Date.now() + 60000);
          setMsg("Please wait a minute before requesting another confirmation email.");
        } else
          setMsg(
            "We couldn’t request a confirmation email. Please try again shortly or use Continue with Google for your Gmail account.",
          );
        return;
      }
      setResendUntil(Date.now() + 60000);
      setMsg(
        "If this email has an account waiting for confirmation, a new confirmation email has been requested. Check Gmail’s Spam and All Mail folders and use the newest link. If you originally used Google or Apple, use that sign-in button instead.",
      );
    } catch {
      setMsg(
        "The confirmation request could not be completed. Check your connection and try again.",
      );
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
      const target = stored === "/" ? "/admin" : stored;
      window.location.assign(target);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const oauth = async (provider: "google" | "apple", label: string) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMsg("");
    sessionStorage.setItem(RETURN_KEY, next);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) {
        sessionStorage.removeItem(RETURN_KEY);
        setMsg(result.error.message || `${label} sign-in could not be started. Please try again.`);
        return;
      }
      if (result.redirected) return;
      sessionStorage.removeItem(RETURN_KEY);
      window.location.assign(next === "/" ? "/admin" : next);
    } catch {
      sessionStorage.removeItem(RETURN_KEY);
      setMsg(`${label} sign-in could not be completed. Check your connection and try again.`);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Section className="pt-32">
      <div className="mx-auto max-w-md">
        <p className="text-sm uppercase tracking-[0.2em] text-clay">
          {traveller ? "Pelican traveller" : "Pelican team"}
        </p>
        <h1 className="mt-3 font-display text-5xl">
          {mode === "in" ? "Sign in" : "Create account"}
        </h1>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mt-6 w-full"
          disabled={busy}
          onClick={() => oauth("google", "Google")}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="mr-2 h-4 w-4">
            <path
              fill="#EA4335"
              d="M12 5.04c1.62 0 3.06.56 4.2 1.66l3.12-3.12C17.4 1.76 14.94.75 12 .75 7.62.75 3.84 3.27 2.04 6.94l3.66 2.84C6.6 7.02 9.08 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.25 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.32-5.17 3.32-8.82z"
            />
            <path
              fill="#FBBC05"
              d="M5.7 14.22a7.2 7.2 0 0 1 0-4.44L2.04 6.94a11.26 11.26 0 0 0 0 10.12l3.66-2.84z"
            />
            <path
              fill="#34A853"
              d="M12 23.25c3.04 0 5.6-1 7.46-2.72l-3.86-3c-1.07.72-2.44 1.15-3.6 1.15-2.92 0-5.4-1.98-6.3-4.71l-3.66 2.84c1.8 3.66 5.58 6.44 9.96 6.44z"
            />
          </svg>
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mt-3 w-full"
          disabled={busy}
          onClick={() => oauth("apple", "Apple")}
        >
          <svg aria-hidden viewBox="0 0 384 512" className="mr-2 h-4 w-4 fill-current">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
          </svg>
          Continue with Apple
        </Button>
        <div className="mt-7 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {mode === "up" ? "or create an account with email" : "or sign in with email"}
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={go} className="mt-6 space-y-6">
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
              minLength={mode === "up" ? 8 : undefined}
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
        <Button
          type="button"
          variant="link"
          className="mt-3 block px-0"
          disabled={busy || resendWaiting}
          onClick={() => void resendConfirmation()}
        >
          {resendWaiting ? "Wait a minute before resending" : "Resend confirmation email"}
        </Button>
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
