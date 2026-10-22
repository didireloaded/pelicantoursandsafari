import { AdminNavigation } from "@/components/admin/navigation";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "building_itinerary", label: "Building itinerary" },
  { value: "quote_sent", label: "Quote sent" },
  { value: "confirmed", label: "Confirmed" },
  { value: "closed", label: "Closed" },
];

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Enquiries — Pelican dashboard" },
      { name: "description", content: "Pelican enquiry pipeline." },
      { property: "og:title", content: "Pelican dashboard" },
      { property: "og:description", content: "Pelican enquiry pipeline." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [staff, setStaff] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [overdue, setOverdue] = useState(false);
  const [directory, setDirectory] = useState<{ user_id: string; email: string }[]>([]);
  const [history, setHistory] = useState<Database["public"]["Tables"]["enquiry_events"]["Row"][]>(
    [],
  );
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const moreLock = useRef(false);
  const saving = useRef(new Set<string>());

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", u.user?.id ?? "");
        const ok = !!roles?.length;
        setStaff(ok);
        if (ok) {
          const { data, error } = await supabase
            .from("enquiries")
            .select("*")
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(500);
          if (error) toast.error("Enquiries could not be loaded. Please reload to try again.");
          else {
            setRows(data ?? []);
            setMore(data?.length === 500);
          }
        }
        const team = await supabase.rpc("staff_directory");
        if (team.error) toast.error("Staff directory could not be loaded.");
        else setDirectory(team.data ?? []);
      } catch {
        setStaff(false);
        toast.error("Dashboard could not be loaded. Please reload.");
      }
    })();
  }, []);

  const update = async (
    id: string,
    patch: Partial<Pick<Enquiry, "status" | "staff_notes" | "assigned_to" | "follow_up_on">>,
  ) => {
    const previous = rows.find((r) => r.id === id);
    if (!previous || saving.current.has(id)) {
      toast.error("A save is already in progress. Please try again shortly.");
      return;
    }
    saving.current.add(id);
    try {
      const { data, error } = await supabase
        .from("enquiries")
        .update(patch)
        .eq("id", id)
        .eq("updated_at", previous.updated_at)
        .select()
        .single();
      if (error || !data) {
        toast.error(
          "This change was not saved. Reload to check for changes by another team member.",
        );
        return;
      }
      setRows((r) => r.map((x) => (x.id === id ? data : x)));
    } catch {
      toast.error("This change was not saved. Check your connection and try again.");
    } finally {
      saving.current.delete(id);
    }
  };
  async function loadMore() {
    const last = rows.at(-1);
    if (!last || moreLock.current) return;
    moreLock.current = true;
    setLoadingMore(true);
    try {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .or(
          `created_at.lt.${last.created_at},and(created_at.eq.${last.created_at},id.lt.${last.id})`,
        )
        .limit(500);
      if (error) throw error;
      setRows((previous) => [...previous, ...(data ?? [])]);
      setMore(data?.length === 500);
    } catch {
      toast.error("Older enquiries could not be loaded. Please retry.");
    } finally {
      moreLock.current = false;
      setLoadingMore(false);
    }
  }
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (staff === null)
    return (
      <Section className="pt-32">
        <p>Loading…</p>
      </Section>
    );
  if (!staff)
    return (
      <Section className="pt-32">
        <h1 className="font-display text-4xl">Access pending</h1>
        <p className="mt-4 max-w-lg text-muted-foreground">
          Your account is signed in but has not been given staff access yet. Ask a Pelican
          administrator to grant it.
        </p>
        <Button variant="outline" className="mt-8" onClick={signOut}>
          Sign out
        </Button>
      </Section>
    );

  async function showHistory(id: string) {
    setOpen(open === id ? null : id);
    setHistory([]);
    try {
      const { data, error } = await supabase
        .from("enquiry_events")
        .select("*")
        .eq("enquiry_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setHistory(data ?? []);
    } catch {
      toast.error("History could not be loaded.");
    }
  }
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Windhoek",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const shown = rows.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (!overdue ||
        (!!r.follow_up_on &&
          r.follow_up_on < today &&
          !["confirmed", "closed"].includes(r.status))) &&
      [r.name, r.email, r.phone, r.id, r.brief, r.booking_ref, r.trip_code, r.enquiry_ref].some((v) =>
        v?.toLowerCase().includes(query.toLowerCase()),
      ),
  );
  return (
    <Section className="pt-32">
      <AdminNavigation />
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-clay">Pelican team</p>
          <h1 className="mt-3 font-display text-5xl">Enquiries</h1>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="ghost">
            <Link to="/trips-manage">Manage trips</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/proposals" search={{}}>
              Proposals
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/content-manage">Approved content</Link>
          </Button>
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Filter by status">
        {[{ value: "all" as const, label: "All" }, ...statuses].map((s) => {
          const n =
            s.value === "all" ? rows.length : rows.filter((r) => r.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`border-b py-1 ${filter === s.value ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
            >
              {s.label} <span className="text-clay">{n}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-6 flex flex-wrap gap-6">
        <label>
          Search enquiries
          <input
            className="ml-3 border-b bg-transparent py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          <input
            type="checkbox"
            className="mr-2 accent-primary"
            checked={overdue}
            onChange={(e) => setOverdue(e.target.checked)}
          />
          Overdue follow-ups
        </label>
        <p className="text-sm text-muted-foreground">
          Search covers loaded enquiries. Load older enquiries below to extend it. Follow-up dates
          use Namibia time; reminders appear here.
        </p>
      </div>
      <ul className="mt-6 divide-y divide-border border-y border-border">
        {shown.map((r) => (
          <li key={r.id} className="py-5">
            <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_auto]">
              <button className="text-left" onClick={() => void showHistory(r.id)}>
                <span className="text-lg font-medium">{r.name}</span>
                {(r.booking_ref ?? r.enquiry_ref) && <span className="ml-3 text-sm font-semibold text-clay">{r.booking_ref ?? r.enquiry_ref}</span>}
                <span className="ml-3 text-sm text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()} · {r.contact_preference}
                </span>
              </button>
              <span className="text-sm text-muted-foreground">
                {[r.email, r.phone].filter(Boolean).join(" · ")}
              </span>
              <select
                aria-label="Status"
                className="border-b border-foreground/25 bg-transparent py-2"
                value={r.status}
                onChange={(e) => update(r.id, { status: e.target.value as Status })}
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {open === r.id && (
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <p className="text-sm break-all">Reference: {r.booking_ref ?? r.enquiry_ref ?? r.id}</p>
                  <label className="block">
                    Assigned to
                    <select
                      className="ml-3 border-b bg-transparent py-2"
                      value={r.assigned_to ?? ""}
                      onChange={(e) => void update(r.id, { assigned_to: e.target.value || null })}
                    >
                      <option value="">Unassigned</option>
                      {directory.map((u) => (
                        <option key={u.user_id} value={u.user_id}>
                          {u.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    Follow up on
                    <input
                      type="date"
                      className="ml-3 border-b bg-transparent py-2"
                      value={r.follow_up_on ?? ""}
                      onChange={(e) => void update(r.id, { follow_up_on: e.target.value || null })}
                    />
                  </label>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {r.brief}
                </pre>
                <label className="text-sm">
                  Team notes
                  <textarea
                    rows={6}
                    className="mt-2 w-full border border-border bg-transparent p-3"
                    defaultValue={r.staff_notes ?? ""}
                    onBlur={(e) => update(r.id, { staff_notes: e.target.value })}
                  />
                </label>
                <div className="md:col-span-2">
                  <h3>Activity history</h3>
                  {history
                    .filter((event) => event.enquiry_id === r.id)
                    .map((event) => (
                      <p key={event.id} className="mt-2 text-sm">
                        {new Date(event.created_at).toLocaleString()} ·{" "}
                        {directory.find((u) => u.user_id === event.actor_id)?.email ?? "Team"} ·{" "}
                        {event.previous_status} → {event.next_status}
                        {event.notes_changed ? " · notes changed" : ""}
                        {event.previous_assignee !== event.next_assignee
                          ? ` · assigned to ${directory.find((u) => u.user_id === event.next_assignee)?.email ?? event.next_assignee ?? "unassigned"}`
                          : ""}
                        {event.previous_follow_up !== event.next_follow_up
                          ? ` · follow-up ${event.next_follow_up ?? "cleared"}`
                          : ""}
                      </p>
                    ))}
                </div>
              </div>
            )}
          </li>
        ))}
        {!shown.length && <li className="py-10 text-muted-foreground">No enquiries here yet.</li>}
      </ul>
      {more && (
        <Button className="mt-6" variant="outline" disabled={loadingMore} onClick={loadMore}>
          {loadingMore ? "Loading…" : "Load older enquiries"}
        </Button>
      )}
    </Section>
  );
}
