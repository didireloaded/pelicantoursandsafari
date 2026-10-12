import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Section } from "@/components/site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Reset password — Pelican" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPassword,
});
function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setReady(!!session);
    });
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (active) {
          setReady(!error && !!data.user);
          if (error || !data.user)
            setMessage(
              "Open a current password recovery link from your email. If it has expired, request a new one from sign in.",
            );
        }
      })
      .catch(() => {
        if (active)
          setMessage("Could not verify your session. Check your connection and try again.");
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lock.current || !ready || done) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setDone(true);
      setMessage("Your password has been updated.");
    } catch {
      setMessage(
        "Your password was not confirmed updated. Check your connection or request a fresh recovery link and try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Section className="pt-32">
      <div className="mx-auto max-w-md">
        <p className="text-sm uppercase tracking-[0.2em] text-clay">Pelican account</p>
        <h1 className="mt-3 font-display text-5xl">Reset password</h1>
        {!done && (
          <form onSubmit={save} className="mt-10 space-y-6">
            <label className="block">
              New password
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-2 w-full border-b border-foreground/25 bg-transparent py-3 outline-none focus:border-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button type="submit" size="lg" className="w-full" disabled={!ready || busy}>
              Update password
            </Button>
          </form>
        )}
        {message && (
          <p role="status" className="mt-6 text-sm text-muted-foreground">
            {message}
          </p>
        )}
        <Button asChild variant="link" className="mt-6 px-0">
          <Link to="/auth" search={{ next: "/dashboard" }}>
            Back to sign in
          </Link>
        </Button>
      </div>
    </Section>
  );
}
