import type { Database } from "@/integrations/supabase/types";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "./photo-upload";

export function StaffProfile({
  userId,
  email,
  verified,
}: {
  userId: string;
  email: string;
  verified: boolean;
}) {
  const cache = useQueryClient();
  const profile = useQuery({
    queryKey: ["staff-profile", userId],
    enabled: verified,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("user_id", userId)
        .abortSignal(AbortSignal.timeout(10000))
        .maybeSingle();
      if (error) throw new Error("Your profile could not be loaded.");
      return data;
    },
  });
  const [name, setName] = useState("");
  const [path, setPath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    if (profile.isSuccess && !dirty) {
      setName(profile.data?.display_name ?? email.split("@")[0] ?? "Staff");
      setPath(profile.data?.avatar_path ?? null);
    }
  }, [profile.data, profile.isSuccess, email, dirty]);
  useBlocker({
    shouldBlockFn: () =>
      saving || uploading || (dirty && !window.confirm("Discard unsaved profile changes?")),
    enableBeforeUnload: () => dirty || saving || uploading,
  });
  return (
    <section className="admin-panel mt-6 max-w-xl p-6">
      <h2 className="admin-panel-heading">Your profile</h2>
      <p className="mt-2 text-xs text-muted-foreground">
        Your name and optional photo appear in the team circles. Only staff can see them.
      </p>
      <dl className="mt-4 border-y border-border py-3 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Sign-in email</dt>
          <dd className="truncate">{email}</dd>
        </div>
      </dl>
      {!verified ? (
        <p className="mt-4 text-sm">Verify your authenticator before editing your profile.</p>
      ) : profile.isError ? (
        <>
          <p role="alert" className="mt-4 text-sm">
            Your profile could not be loaded.
          </p>
          <Button variant="outline" onClick={() => void profile.refetch()}>
            Retry
          </Button>
        </>
      ) : profile.isPending ? (
        <p role="status">Loading your profile…</p>
      ) : (
        <form
          className="admin-form mt-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (lock.current || uploading) return;
            lock.current = true;
            setSaving(true);
            setMessage("");
            try {
              // Generated RPC types omit SQL nullability; null removes an optional photo.
              const { data, error } = await supabase
                .rpc("save_staff_profile", {
                  _revision: profile.data?.revision ?? 0,
                  _display_name: name.trim(),
                  _avatar_path: path,
                } as Database["public"]["Functions"]["save_staff_profile"]["Args"])
                .abortSignal(AbortSignal.timeout(15000));
              if (
                error ||
                !data ||
                typeof data !== "object" ||
                Array.isArray(data) ||
                data["user_id"] !== userId
              )
                throw new Error("Profile save not confirmed");
              const saved = data as Database["public"]["Tables"]["staff_profiles"]["Row"];
              cache.setQueryData(["staff-profile", userId], saved);
              cache.setQueryData<Database["public"]["Tables"]["staff_profiles"]["Row"][]>(
                ["staff-profiles"],
                (previous) => [
                  ...(previous ?? []).filter((profile) => profile.user_id !== userId),
                  saved,
                ],
              );
              await cache.invalidateQueries({ queryKey: ["staff-profile", userId] });
              await cache.invalidateQueries({ queryKey: ["staff-profiles"] });
              await cache.invalidateQueries({ queryKey: ["staff-presence"] });
              setDirty(false);
              setMessage("Profile saved.");
            } catch {
              setMessage(
                "Save not confirmed. Your changes are retained. Reload the page to check for another saved version before retrying.",
              );
            } finally {
              lock.current = false;
              setSaving(false);
            }
          }}
        >
          <fieldset disabled={saving || uploading} className="space-y-5">
            <label>
              Display name
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setDirty(true);
                }}
              />
            </label>
            <PhotoUpload
              purpose="profile"
              userId={userId}
              path={path}
              onChange={(value) => {
                setPath(value);
                setDirty(true);
              }}
              onBusy={setUploading}
            />
            {path && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPath(null);
                  setDirty(true);
                }}
              >
                Remove profile photo
              </Button>
            )}
            <Button type="submit" disabled={!dirty}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </fieldset>
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        </form>
      )}
    </section>
  );
}
