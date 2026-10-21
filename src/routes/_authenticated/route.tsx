import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkTravellerSession } from "@/lib/traveller-session";
import { Section } from "@/components/site";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await checkTravellerSession(() => supabase.auth.getUser());
    if (error || !data.user) throw redirect({ to: "/auth", search: { next: location.href } });
    return { user: data.user };
  },
  component: () => <Outlet />,
  pendingMs: 0,
  pendingComponent: () => <Section><p role="status">Checking your sign-in…</p></Section>,
});
