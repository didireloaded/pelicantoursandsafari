import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import { initials } from "@/lib/admin-workspace";
const membersSchema = z.array(
  z.object({
    user_id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(["admin", "staff"]),
  }),
);
type Member = z.infer<typeof membersSchema>[number];
function teamError(error: unknown) {
  const message =
    typeof error === "object" && error !== null && "message" in error ? String(error.message) : "";
  return /Team limit reached/.test(message)
    ? "Your team already has five people. Remove access for someone before adding another person."
    : /verify its email first/.test(message)
      ? "Ask this person to sign in or create an account and verify their email first. Then add that same email here."
      : /own team access|at least one administrator/.test(message)
        ? "Keep another administrator in place before changing this access."
        : "The change was not confirmed. Refresh the team list before retrying.";
}
export function TeamSettings({ verified, userId }: { verified: boolean; userId: string }) {
  const [canManage, setCanManage] = useState<boolean | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    if (!verified) return;
    let active = true;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const check = await supabase.rpc("can_manage_team").abortSignal(AbortSignal.timeout(10000));
        if (check.error) throw check.error;
        if (!active) return;
        if (!check.data) {
          setCanManage(false);
          return;
        }
        const result = await supabase.rpc("team_members").abortSignal(AbortSignal.timeout(10000));
        if (result.error) throw result.error;
        const parsed = membersSchema.parse(result.data);
        if (active) {
          setMembers(parsed);
          setCanManage(true);
        }
      } catch {
        if (active) {
          setCanManage(null);
          setError("Team access could not be checked. Please retry.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [verified, reload]);
  async function mutate(action: () => PromiseLike<{ error: unknown }>, success: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await action();
      if (result.error) throw result.error;
      setMessage(success);
      setReload((value) => value + 1);
      setEmail("");
    } catch (error) {
      setError(teamError(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="admin-panel mt-6 max-w-3xl p-6">
      <div className="flex items-center gap-2">
        <Users size={17} className="text-primary" />
        <h2 className="admin-panel-heading">Your team</h2>
        {canManage && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {members.length} / 5 accounts
          </span>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Up to five people can use the admin panel, each with their own email, Google or Apple
        account.
      </p>
      {!verified ? (
        <p className="mt-4 text-xs">Verify your authenticator to manage team access.</p>
      ) : loading ? (
        <p role="status" className="mt-4 text-xs">
          Loading team access…
        </p>
      ) : canManage ? (
        <>
          <ul className="mt-5 divide-y divide-border">
            {members.map((member) => (
              <li key={member.user_id} className="flex flex-wrap items-center gap-3 py-4">
                <span className="admin-avatar !h-8 !w-8 !text-[10px]">
                  {initials(member.email.split("@")[0] ?? "Team")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-all text-xs font-medium">
                    {member.email}
                    {member.user_id === userId ? " · You" : ""}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {member.role === "admin"
                      ? "Administrator · manages team access"
                      : "Team member · manages trips and content"}
                  </p>
                </div>
                <AppSelect
                  aria-label={`Role for ${member.email}`}
                  className="!w-36 !text-[10px]"
                  disabled={busy || loading || member.user_id === userId}
                  value={member.role}
                  onChange={(event) => {
                    const next = event.target.value as Member["role"];
                    if (
                      window.confirm(
                        `Change ${member.email} to ${next === "admin" ? "an administrator with team-management access" : "a team member"}?`,
                      )
                    )
                      void mutate(
                        () =>
                          supabase.rpc("set_team_member", { _email: member.email, _role: next }),
                        "Team access updated.",
                      );
                  }}
                >
                  <option value="staff">Team member</option>
                  <option value="admin">Administrator</option>
                </AppSelect>
                <Button
                  variant="ghost"
                  className="!text-[10px]"
                  disabled={busy || loading || member.user_id === userId}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remove ${member.email} from the team? Their account stays, but staff tools will no longer be accessible.`,
                      )
                    )
                      void mutate(
                        () => supabase.rpc("remove_team_member", { _user_id: member.user_id }),
                        "Team access removed.",
                      );
                  }}
                >
                  Remove access
                </Button>
              </li>
            ))}
          </ul>
          <form
            className="admin-form mt-5 border-t border-border pt-5"
            onSubmit={(event) => {
              event.preventDefault();
              void mutate(
                () =>
                  supabase.rpc("set_team_member", {
                    _email: email.trim().toLowerCase(),
                    _role: role,
                  }),
                "Team member added. They can now open the admin panel after verifying their authenticator.",
              );
            }}
          >
            <h3 className="text-xs font-medium">Add an approved team member</h3>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Share the{" "}
              <a
                href="/auth?next=%2Fadmin"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                team sign-in link
              </a>{" "}
              first. Once they have signed in and verified their email, add that same address here.
              For Apple’s Hide My Email, use the address shown in their account settings.
            </p>
            <fieldset
              disabled={busy || loading || members.length >= 5}
              className="mt-4 flex flex-wrap items-end gap-3"
            >
              <label className="min-w-52 flex-1">
                Approved email
                <input
                  type="email"
                  required
                  maxLength={255}
                  autoComplete="off"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                Access
                <AppSelect
                  value={role}
                  onChange={(event) => setRole(event.target.value as Member["role"])}
                >
                  <option value="staff">Team member</option>
                  <option value="admin">Administrator</option>
                </AppSelect>
              </label>
              <Button type="submit" className="gap-2 !text-xs">
                <Plus size={13} />
                {busy ? "Saving…" : "Add member"}
              </Button>
            </fieldset>
            {members.length >= 5 && (
              <p className="mt-3 text-xs text-muted-foreground">All five places are in use.</p>
            )}
          </form>
        </>
      ) : canManage === false ? (
        <div className="mt-4 space-y-2 text-xs leading-relaxed">
          <p>
            A team administrator manages approved accounts here. Signing up does not automatically
            give access to private staff tools.
          </p>
          <p className="text-muted-foreground">
            An administrator must be configured before anyone can add or remove members. If your
            team has no administrator yet, the business owner needs to be set up as the first one;
            after that they manage all five seats from this page.
          </p>
          <p className="text-muted-foreground">Seat limit: 5 accounts, including administrators.</p>
        </div>
      ) : null}
      {error && (
        <p role="alert" className="mt-4 text-xs">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-4 text-xs">
          {message}
        </p>
      )}
      {verified && (
        <Button
          variant="link"
          className="mt-3 px-0 !text-[11px]"
          disabled={busy || loading}
          onClick={() => setReload((value) => value + 1)}
        >
          Refresh team access
        </Button>
      )}
    </section>
  );
}
