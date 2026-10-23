import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  clearStaffDeviceTrust,
  trustStaffDevice,
  trustedStaffDeviceExpiry,
} from "@/lib/trusted-staff-device";
export const Route = createFileRoute("/_authenticated/admin/account")({ component: Account });
function Account() {
  const { user, adminAssurance } = Route.useRouteContext();
  const verifiedSession = adminAssurance === "aal2";
  const [securityLoaded, setSecurityLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [factors, setFactors] = useState<{ id: string; status: string }[]>([]);
  const [enrollment, setEnrollment] = useState<{ id: string; qr: string }>();
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  useEffect(() => {
    void supabase.auth.mfa.listFactors().then((result) => {
      if (result.error) setMessage("Security status could not be loaded.");
      else setFactors(result.data.totp);
      setSecurityLoaded(true);
    });
  }, []);
  async function verify(id: string) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await supabase.auth.mfa.challengeAndVerify({ factorId: id, code });
      if (result.error) throw result.error;
      trustStaffDevice(user.id, rememberDevice);
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
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">YOUR WORKSPACE</p>
          <h1 className="mt-2">Settings</h1>
          <p>Manage your account and sign-in.</p>
        </div>
      </div>
      <section className="admin-panel max-w-xl p-6">
        <h2 className="admin-panel-heading">Your account</h2>
        <p className="mt-3 text-sm">{user.email}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {user.email_confirmed_at ? "Email verified" : "Email verification pending"}
        </p>
      </section>
      <p className="mt-5 text-sm">
        <Link to="/admin/profile" className="text-primary underline">
          Edit your name and profile photo →
        </Link>
      </p>
      <p role="status" className="mt-5">
        {message}
      </p>
      <section className="admin-panel mt-6 max-w-xl space-y-5 p-6">
        <h2 className="admin-panel-heading">Sign-in security</h2>
        {verifiedSession ? (
          <div className="space-y-2 text-sm text-primary">
            <p>Your sign-in is verified. Your account is protected.</p>
            {trustedStaffDeviceExpiry(user.id) && (
              <p className="text-xs text-muted-foreground">
                This device is trusted until{" "}
                {new Date(trustedStaffDeviceExpiry(user.id)!).toLocaleDateString("en-GB")}.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Verify your authenticator to manage the workspace.
          </p>
        )}
        {securityLoaded &&
          !verifiedSession &&
          !factors.some((factor) => factor.status === "verified") &&
          !enrollment && (
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
        {!verifiedSession &&
          (enrollment || factors.some((factor) => factor.status === "verified")) && (
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
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={rememberDevice}
                  onChange={(event) => setRememberDevice(event.target.checked)}
                />
                <span>
                  <strong className="block font-medium">Trust this device for 30 days</strong>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Use this only on a private device. Signing out removes this trust.
                  </span>
                </span>
              </label>
              <Button disabled={busy}>Verify code</Button>
            </form>
          )}
      </section>
      <p className="mt-6 max-w-xl text-xs text-muted-foreground">
        Team access now lives on the{" "}
        <Link to="/admin/team" className="text-primary underline">
          Team page
        </Link>
        .
      </p>
      <div className="admin-panel mt-6 flex max-w-xl flex-wrap gap-4 p-6">
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
            clearStaffDeviceTrust();
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
