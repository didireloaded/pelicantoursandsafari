import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/site";
import { toast } from "sonner";
import { useRef } from "react";

type Enquiry = Database["public"]["Tables"]["enquiries"]["Row"];
type Status = Database["public"]["Enums"]["enquiry_status"];
const statuses: { value: Status; label: string }[] = [
  { value: "new", label: "New" }, { value: "contacted", label: "Contacted" }, { value: "building_itinerary", label: "Building itinerary" },
  { value: "quote_sent", label: "Quote sent" }, { value: "confirmed", label: "Confirmed" }, { value: "closed", label: "Closed" },
];

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Enquiries — Pelican dashboard" }, { name: "description", content: "Pelican enquiry pipeline." }, { property: "og:title", content: "Pelican dashboard" }, { property: "og:description", content: "Pelican enquiry pipeline." }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [staff, setStaff] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const saving = useRef(new Set<string>());

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user?.id ?? "");
      const ok = !!roles?.length; setStaff(ok);
      if (ok) { const { data, error } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(500); if (error) toast.error("Enquiries could not be loaded. Please reload to try again."); else setRows(data ?? []); }
    })();
  }, []);

  const update = async (id: string, patch: Partial<Pick<Enquiry, "status" | "staff_notes">>) => {
    const previous = rows.find((r) => r.id === id);
    if (!previous || saving.current.has(id)) { toast.error("A save is already in progress. Please try again shortly."); return; }
    saving.current.add(id);
    try {
      const { data, error } = await supabase.from("enquiries").update(patch).eq("id", id).eq("updated_at", previous.updated_at).select().single();
      if (error || !data) { toast.error("This change was not saved. Reload to check for changes by another team member."); return; }
      setRows((r) => r.map((x) => x.id === id ? data : x));
    } catch { toast.error("This change was not saved. Check your connection and try again."); }
    finally { saving.current.delete(id); }
  };
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  if (staff === null) return <Section className="pt-32"><p>Loading…</p></Section>;
  if (!staff) return <Section className="pt-32"><h1 className="font-display text-4xl">Access pending</h1><p className="mt-4 max-w-lg text-muted-foreground">Your account is signed in but has not been given staff access yet. Ask a Pelican administrator to grant it.</p><Button variant="outline" className="mt-8" onClick={signOut}>Sign out</Button></Section>;

  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  return <Section className="pt-32">
    <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
      <div><p className="text-sm uppercase tracking-[0.2em] text-clay">Pelican team</p><h1 className="mt-3 font-display text-5xl">Enquiries</h1></div>
      <Button variant="ghost" onClick={signOut}>Sign out</Button>
    </div>
    <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Filter by status">
      {[{ value: "all" as const, label: "All" }, ...statuses].map((s) => {
        const n = s.value === "all" ? rows.length : rows.filter((r) => r.status === s.value).length;
        return <button key={s.value} onClick={() => setFilter(s.value)} className={`border-b py-1 ${filter === s.value ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{s.label} <span className="text-clay">{n}</span></button>;
      })}
    </nav>
    <ul className="mt-6 divide-y divide-border border-y border-border">
      {shown.map((r) => <li key={r.id} className="py-5">
        <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_auto]">
          <button className="text-left" onClick={() => setOpen(open === r.id ? null : r.id)}>
            <span className="text-lg font-medium">{r.name}</span>
            <span className="ml-3 text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.contact_preference}</span>
          </button>
          <span className="text-sm text-muted-foreground">{[r.email, r.phone].filter(Boolean).join(" · ")}</span>
          <select aria-label="Status" className="border-b border-foreground/25 bg-transparent py-2" value={r.status} onChange={(e) => update(r.id, { status: e.target.value as Status })}>{statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        </div>
        {open === r.id && <div className="mt-5 grid gap-6 md:grid-cols-2">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{r.brief}</pre>
          <label className="text-sm">Team notes<textarea rows={6} className="mt-2 w-full border border-border bg-transparent p-3" defaultValue={r.staff_notes ?? ""} onBlur={(e) => update(r.id, { staff_notes: e.target.value })} /></label>
        </div>}
      </li>)}
      {!shown.length && <li className="py-10 text-muted-foreground">No enquiries here yet.</li>}
    </ul>
  </Section>;
}
