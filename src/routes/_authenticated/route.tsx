import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkTravellerSession } from "@/lib/traveller-session";
import { Section } from "@/components/site";
import { isStaffDeviceTrusted } from "@/lib/trusted-staff-device";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await checkTravellerSession(() => supabase.auth.getUser());
    if (error || !data.user) throw redirect({ to: "/auth", search: { next: location.href } });
    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const adminAssurance =
      !assurance.error &&
      assurance.data.currentLevel === "aal2" &&
      isStaffDeviceTrusted(data.user.id)
        ? "aal2"
        : "aal1";
    return { user: data.user, adminAssurance };
  },
  component: () => <Outlet />,
  pendingMs: 0,
  pendingComponent: () => (
    <Section>
      <p role="status">Checking your sign-in…</p>
    </Section>
  ),
});
