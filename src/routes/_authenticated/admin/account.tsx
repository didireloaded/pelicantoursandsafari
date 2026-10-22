import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/admin/account")({ component: Account });
function Account() {
  const { user } = Route.useRouteContext();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [factors, setFactors] = useState<{ id: string; status: string }[]>([]);
  const [enrollment, setEnrollment] = useState<{ id: string; qr: string }>();
  const [code, setCode] = useState("");
  useEffect(() => {
    void supabase.auth.mfa.listFactors().then((result) => {
      if (result.error) setMessage("Security status could not be loaded.");
      else setFactors(result.data.totp);
    });
  }, []);
  async function verify(id: string) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await supabase.auth.mfa.challengeAndVerify({ factorId: id, code });
      if (result.error) throw result.error;
      setEnrollment(undefined);
      setCode("");
      setFactors([{ id, status: "verified" }]);
      window.location.assign("/admin");
    } catch {
      setMessage("Code could not be verified. Use the current code and retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1 className="text-4xl md:text-6xl">Your account</h1>
      <p className="mt-5">Signed in as {user.email}</p>
      <p role="status" className="mt-5">
        {message}
      </p>
      <section className="mt-8 max-w-xl space-y-5 border-t border-border pt-6">
        <h2 className="text-2xl">Authenticator security</h2>
        <p>
          An authenticator app is required to publish packages and photos. Staff access is assigned
          by your website manager; registering an account never grants editing access.
        </p>
        {!factors.some((factor) => factor.status === "verified") && !enrollment && (
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const result = await supabase.auth.mfa.enroll({
                  factorType: "totp",
                  friendlyName: `Pelican ${Date.now()}`,
                });
                if (result.error) throw result.error;
                setEnrollment({ id: result.data.id, qr: result.data.totp.qr_code });
              } catch {
                setMessage("Authenticator setup unavailable. Please retry.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Set up authenticator
          </Button>
        )}
        {enrollment && (
          <>
            <p>
              Scan this private QR code with your authenticator app, then enter its six-digit code.
              Do not share the QR code.
            </p>
            <img
              src={
                enrollment.qr.startsWith("data:")
                  ? enrollment.qr
                  : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(enrollment.qr)}`
              }
              alt="Private authenticator setup QR code"
              className="h-48 w-48"
            />
          </>
        )}
        {(enrollment || factors.some((factor) => factor.status === "verified")) && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const id =
                enrollment?.id ?? factors.find((factor) => factor.status === "verified")?.id;
              if (id) void verify(id);
            }}
          >
            <label className="block">
              Authenticator code
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                className="mt-2 block w-full border-b bg-transparent py-3"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </label>
            <Button disabled={busy}>Verify code</Button>
          </form>
        )}
      </section>
      <div className="mt-10 flex flex-wrap gap-4">
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const result = await supabase.auth.resetPasswordForEmail(user.email ?? "", {
              redirectTo: `${window.location.origin}/reset-password`,
            });
            setMessage(
              result.error
                ? "Recovery email could not be requested. Please retry."
                : "Recovery email requested. Check your inbox.",
            );
            setBusy(false);
          }}
        >
          Request password recovery email
        </Button>
        <Button
          variant="ghost"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const result = await supabase.auth.signOut();
            if (result.error) {
              setMessage("Sign-out failed. Please retry.");
              setBusy(false);
            } else window.location.assign("/auth?next=%2Fadmin");
          }}
        >
          Sign out
        </Button>
      </div>
    </>
  );
}
