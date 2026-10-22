import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStaffProfiles } from "@/lib/staff-profiles";
import { StaffAvatar } from "./staff-avatar";
import { WorkspaceState } from "./workspace-state";

type Member = { user_id: string; email: string; role?: string | null };

export function StaffDirectory({ userId, verified }: { userId: string; verified: boolean }) {
  const [selected, setSelected] = useState("");
  const profiles = useStaffProfiles(verified);
  const directory = useQuery({
    queryKey: ["staff-directory"],
    enabled: verified,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase.rpc("staff_directory").abortSignal(AbortSignal.timeout(10000));
      if (error) throw new Error("Team directory could not be loaded.");
      return data ?? [];
    },
    refetchInterval: 60000,
    retry: 1,
  });
  // Only team administrators can obtain authoritative role information.
  const roles = useQuery({
    queryKey: ["team-directory-roles"],
    enabled: verified,
    queryFn: async (): Promise<Member[]> => {
      const result = await supabase.rpc("team_members").abortSignal(AbortSignal.timeout(10000));
      return result.error ? [] : (result.data ?? []);
    },
    refetchInterval: 60000,
    retry: 0,
  });
  if (!verified) return <p>Verify your authenticator to view the team.</p>;
  const staff = (directory.data ?? []).map((member) => {
    const profile = profiles.data?.find((row) => row.user_id === member.user_id);
    const role = roles.data?.find((row) => row.user_id === member.user_id)?.role ?? null;
    return {
      ...member,
      name: profile?.display_name || member.email.split("@")[0] || "Staff member",
      photo: profile?.avatar_path ?? null,
      role,
    };
  });
  const current = staff.find((person) => person.user_id === selected) ?? staff[0];
  const access = (role: string | null) =>
    role === "admin" ? "Administrator" : role === "staff" ? "Team member" : "Ask an administrator";
  return (
    <WorkspaceState
      loading={profiles.isPending || directory.isPending}
      error={profiles.isError || directory.isError}
      retry={() => { void profiles.refetch(); void directory.refetch(); void roles.refetch(); }}
    >
      <section aria-labelledby="team-members-heading" className="mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="team-members-heading" className="text-xl font-semibold">Staff directory</h2>
          <span className="text-xs text-muted-foreground">{staff.length} active staff account{staff.length === 1 ? "" : "s"}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((member) => (
            <button
              key={member.user_id}
              type="button"
              aria-pressed={current?.user_id === member.user_id}
              onClick={() => setSelected(member.user_id)}
              className="admin-panel flex items-start gap-4 p-5 text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="admin-avatar !h-16 !w-16"><StaffAvatar path={member.photo} name={member.name} /></span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-semibold">{member.name}</strong>
                <span className="mt-1 block text-xs text-muted-foreground">{member.user_id === userId ? "Your account" : "Staff account"}</span>
                <span className="admin-status mt-3 inline-block">{access(member.role)}</span>
                <span className="mt-3 block text-xs font-medium text-primary">View details →</span>
              </span>
            </button>
          ))}
        </div>
        {current && (
          <section className="admin-panel mt-5 max-w-3xl p-6" aria-label="Selected staff member details">
            <div className="flex items-center gap-4">
              <span className="admin-avatar !h-16 !w-16"><StaffAvatar path={current.photo} name={current.name} /></span>
              <div>
                <h3 className="text-lg font-semibold">{current.name}</h3>
                <p className="text-sm text-muted-foreground">{access(current.role)}</p>
              </div>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-border pt-5 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Email</dt><dd className="mt-1 break-all">{current.email}</dd></div>
              <div><dt className="text-muted-foreground">Access level</dt><dd className="mt-1 font-medium">{access(current.role)}</dd></div>
            </dl>
            {current.role === null && (
              <p className="mt-4 text-xs text-muted-foreground">Only team administrators can see exact permission levels.</p>
            )}
            {current.user_id === userId && (
              <Link to="/admin/profile" className="mt-5 inline-block text-sm font-medium text-primary underline underline-offset-4">Edit your profile →</Link>
            )}
          </section>
        )}
        {!staff.length && <p className="admin-panel p-6 text-sm">No approved staff accounts were found.</p>}
      </section>
    </WorkspaceState>
  );
}
