import { createFileRoute, Outlet, redirect, useLocation, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Section } from "@/components/site";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const result = await supabase
      .rpc("is_staff", { _user_id: context.user.id })
      .abortSignal(AbortSignal.timeout(10000));
    if (result.error) throw new Error("Staff access could not be checked. Please retry.");
    if (!result.data) throw redirect({ to: "/dashboard" });
    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error) throw new Error("Security check unavailable.");
    return { adminAssurance: assurance.data.currentLevel };
  },
  head: () => ({
    meta: [{ title: "Administration — Pelican" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLayout,
  errorComponent: ({ reset }) => (
    <Section>
      <h1 className="text-3xl">Administration unavailable</h1>
      <p className="mt-4">Your sign-in or staff permissions could not be verified.</p>
      <button className="mt-5 underline" onClick={reset}>
        Try again
      </button>
    </Section>
  ),
});

function AdminLayout() {
  const { adminAssurance } = Route.useRouteContext();
  const location = useLocation();
  return (
    <div>
      {adminAssurance !== "aal2" && location.pathname !== "/admin/account" ? (
        <>
          <h1 className="text-4xl">Secure your staff sign-in</h1>
          <p className="mt-5 max-w-xl">
            Set up or verify your authenticator before managing website content.
          </p>
          <Link to="/admin/account" className="mt-6 inline-block text-primary underline">
            Open account security →
          </Link>
        </>
      ) : (
        <Outlet />
      )}
    </div>
  );
}
