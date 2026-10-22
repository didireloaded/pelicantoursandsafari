import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStaffProfiles } from "@/lib/staff-profiles";
import { StaffAvatar } from "./staff-avatar";
import { WorkspaceState } from "./workspace-state";
export function StaffDirectory({ userId, verified }: { userId: string; verified: boolean }) {
  const profiles = useStaffProfiles(verified);
  const members = useQuery({
    queryKey: ["staff-directory"],
    enabled: verified,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("staff_directory")
        .abortSignal(AbortSignal.timeout(10000));
      if (error) throw new Error("Staff directory could not be loaded.");
      return data ?? [];
    },
    refetchInterval: 60000,
    retry: 1,
  });
  if (!verified) return <p>Verify your authenticator to view the staff directory.</p>;
  return (
    <WorkspaceState
      loading={profiles.isPending || members.isPending}
      error={profiles.isError || members.isError}
      retry={() => {
        void profiles.refetch();
        void members.refetch();
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {members.data?.map((member) => {
          const profile = profiles.data?.find((row) => row.user_id === member.user_id);
          const name = profile?.display_name || member.email.split("@")[0] || "Staff member";
          return (
            <section key={member.user_id} className="admin-panel flex items-center gap-4 p-5">
              <span className="admin-avatar !h-16 !w-16">
                <StaffAvatar path={profile?.avatar_path ?? null} name={name} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {member.user_id === userId ? "Your profile" : "Pelican team"}
                </p>
                {member.user_id === userId && (
                  <Link
                    to="/admin/profile"
                    className="mt-3 inline-block text-xs text-primary underline"
                  >
                    Edit your profile
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {members.data?.length === 0 && (
        <p className="admin-panel p-6">No staff members could be found.</p>
      )}
    </WorkspaceState>
  );
}
