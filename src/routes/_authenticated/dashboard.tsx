import { ConfirmBooking } from "@/components/admin/confirm-booking";
import { AppSelect } from "@/components/ui/app-select";
import { Search, Clock3, Mail, RefreshCw, ChevronDown } from "lucide-react";
import { initials } from "@/lib/admin-workspace";
import { safaris } from "@/lib/pelican";
import { tripForCode } from "@/lib/booking";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { createFileRoute, Link, useBlocker } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRef } from "react";
import { useAdminSampleMode } from "@/lib/admin-sample-mode";
import { SampleEnquiries } from "@/components/admin/sample-enquiries";

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

function statusLabel(value: string | null) {
  return statuses.find((status) => status.value === value)?.label ?? "Updated";
}
function formatDate(value: string, short = false) {
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Africa/Windhoek",
    day: "numeric",
    month: "short",
    ...(short ? {} : { year: "numeric", hour: "2-digit", minute: "2-digit" }),
  });
}

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
  const sample = useAdminSampleMode();
  return sample ? <SampleEnquiries /> : <LiveDashboard />;
}

function LiveDashboard() {
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
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [directoryError, setDirectoryError] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [noteBases, setNoteBases] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [tab, setTab] = useState("brief");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const detailRef = useRef<HTMLElement>(null);
  const moreLock = useRef(false);
  const saving = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    setLoadingData(true);
    setLoadError(false);
    void (async () => {
      try {
        const user = await supabase.auth.getUser();
        if (user.error || !user.data.user) throw new Error("Sign-in unavailable");
        const roles = await supabase.rpc("can_manage_site");
        if (roles.error) throw roles.error;
        const ok = !!roles.data;
        if (!active) return;
        setStaff(ok);
        if (!ok) return;
        const [enquiries, team] = await Promise.all([
          supabase
            .from("enquiries")
            .select("*")
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(500),
          supabase.rpc("staff_directory"),
        ]);
        if (!active) return;
        if (enquiries.error) throw enquiries.error;
        setRows(enquiries.data ?? []);
        setFeedback({});
        setMore(enquiries.data?.length === 500);
        setDirectoryError(!!team.error);
        setDirectory(team.data ?? []);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoadingData(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const update = async (
    id: string,
    patch: Partial<Pick<Enquiry, "status" | "staff_notes" | "assigned_to" | "follow_up_on">>,
  ) => {
    const previous = rows.find((r) => r.id === id);
    if (!previous || saving.current.has(id)) {
      toast.error("A save is already in progress. Please try again shortly.");
      return false;
    }
    saving.current.add(id);
    setBusyIds((previous) => new Set(previous).add(id));
    setFeedback((previous) => ({ ...previous, [id]: { ok: true, text: "Saving…" } }));
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
        setFeedback((previous) => ({
          ...previous,
          [id]: {
            ok: false,
            text: "Not saved. Refresh to check for another team member’s changes. Your notes are retained.",
          },
        }));
        return false;
      }
      setRows((r) => r.map((x) => (x.id === id ? data : x)));
      setFeedback((previous) => ({
        ...previous,
        [id]: {
          ok: true,
          text:
            patch.status === "confirmed" && data.booking_ref
              ? "Booking confirmed. The traveller will see Confirmed when checking this reference."
              : "Saved",
        },
      }));
      return true;
    } catch {
      toast.error("This change was not saved. Check your connection and try again.");
      setFeedback((previous) => ({
        ...previous,
        [id]: {
          ok: false,
          text: "Not saved. Check your connection and retry. Your notes are retained.",
        },
      }));
      return false;
    } finally {
      saving.current.delete(id);
      setBusyIds((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
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

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Windhoek",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const isOverdue = (r: Enquiry) =>
    !!r.follow_up_on && r.follow_up_on < today && !["confirmed", "closed"].includes(r.status);
  const shown = rows.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (!overdue || isOverdue(r)) &&
      [r.name, r.email, r.phone, r.id, r.brief, r.booking_ref, r.trip_code, r.enquiry_ref].some(
        (value) => value?.toLowerCase().includes(query.trim().toLowerCase()),
      ),
  );
  const current = shown.find((row) => row.id === open) ?? shown[0];
  const dirty = rows.some(
    (row) => drafts[row.id] !== undefined && drafts[row.id] !== (row.staff_notes ?? ""),
  );
  useBlocker({
    shouldBlockFn: () =>
      saving.current.size > 0 ||
      (dirty && !window.confirm("Leave without saving your team notes?")),
    enableBeforeUnload: () => dirty || saving.current.size > 0,
  });
  useEffect(() => {
    if (!current) {
      setHistory([]);
      return;
    }
    let active = true;
    setHistory([]);
    setHistoryLoading(true);
    setHistoryError(false);
    void supabase
      .from("enquiry_events")
      .select("*")
      .eq("enquiry_id", current.id)
      .order("created_at", { ascending: false })
      .then(
        ({ data, error }) => {
          if (!active) return;
          setHistoryLoading(false);
          if (error) setHistoryError(true);
          else setHistory(data ?? []);
        },
        () => {
          if (active) {
            setHistoryLoading(false);
            setHistoryError(true);
          }
        },
      );
    return () => {
      active = false;
    };
  }, [current]);
  useEffect(() => {
    if (open && current?.id === open && window.matchMedia("(max-width: 900px)").matches)
      detailRef.current?.scrollIntoView({ block: "start" });
  }, [open, current?.id]);
  if (loadError)
    return (
      <section className="admin-panel p-6">
        <h1 className="text-xl">Enquiries unavailable</h1>
        <p className="mt-3 text-sm">
          Your enquiries could not be loaded. Your records have not changed.
        </p>
        <Button className="mt-5" onClick={() => setReloadKey((key) => key + 1)}>
          Retry
        </Button>
      </section>
    );
  if (staff === null || loadingData)
    return (
      <div className="admin-panel p-6" role="status">
        Loading your enquiries…
      </div>
    );
  if (!staff)
    return (
      <section className="admin-panel p-6">
        <h1 className="text-xl">Access pending</h1>
        <p className="mt-3 text-sm">
          Your account is signed in but has not been given staff access yet. Ask a Pelican
          administrator to grant it.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/admin/account">Open settings</Link>
        </Button>
      </section>
    );
  const draft = current ? (drafts[current.id] ?? current.staff_notes ?? "") : "";
  const notesChanged = !!current && draft !== (current.staff_notes ?? "");
  const notesConflict =
    !!current &&
    drafts[current.id] !== undefined &&
    noteBases[current.id] !== undefined &&
    noteBases[current.id] !== (current.staff_notes ?? "");
  const working = !!current && busyIds.has(current.id);
  const reference = (row: Enquiry) => row.booking_ref ?? row.enquiry_ref ?? "Legacy enquiry";
  const topic = (row: Enquiry) =>
    tripForCode(row.trip_code ?? "")?.name ??
    safaris.find((safari) => safari.slug === row.safari_slug)?.name ??
    "General enquiry";
  async function saveNotes() {
    if (!current) return;
    const id = current.id;
    const text = draft;
    if (await update(id, { staff_notes: text })) {
      setNoteBases((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
      setDrafts((previous) => {
        if (previous[id] !== text) return previous;
        const next = { ...previous };
        delete next[id];
        return next;
      });
    }
  }
  return (
    <div className="enquiry-inbox">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">PEOPLE, PLANS & NEXT STEPS</p>
          <h1 className="mt-2">Enquiries</h1>
          <p>Choose a traveller, read their plans, and get in touch.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 !text-xs"
            disabled={busyIds.size > 0}
            onClick={() => setReloadKey((key) => key + 1)}
            title={dirty ? "Your unsaved notes will be retained" : undefined}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 !text-xs">
                Related tools
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="pelican-select-menu">
              <DropdownMenuItem asChild>
                <Link to="/trips-manage">Manage trips</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/proposals" search={{}}>
                  Proposals
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/content-manage">Approved content</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <section className="admin-panel enquiry-toolbar" aria-label="Find enquiries">
        <div className="enquiry-search">
          <Search size={16} />
          <input
            aria-label="Search enquiries"
            placeholder="Search a name, reference or message…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <AppSelect
          aria-label="Filter by status"
          value={filter}
          className="enquiry-filter"
          onChange={(e) => setFilter(e.target.value as Status | "all")}
        >
          <option value="all">All enquiries ({rows.length})</option>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label} ({rows.filter((row) => row.status === status.value).length})
            </option>
          ))}
        </AppSelect>
        <button
          className={`enquiry-overdue ${overdue ? "is-selected" : ""}`}
          aria-pressed={overdue}
          onClick={() => setOverdue(!overdue)}
        >
          <Clock3 size={14} />
          Overdue<span>{rows.filter(isOverdue).length}</span>
        </button>
      </section>
      <div className="enquiry-inbox-grid">
        <section className="admin-panel enquiry-list-panel" aria-label="Enquiry inbox">
          <div className="enquiry-list-heading">
            <h2>
              Inbox <span>{shown.length}</span>
            </h2>
            {dirty && <span className="enquiry-unsaved">Unsaved notes</span>}
          </div>
          <div className="enquiry-list-scroll">
            {shown.length ? (
              <ul>
                {shown.map((row) => (
                  <li key={row.id}>
                    <button
                      aria-pressed={current?.id === row.id}
                      className={`enquiry-list-item ${current?.id === row.id ? "is-selected" : ""}`}
                      onClick={() => {
                        setOpen(row.id);
                        setTab("brief");
                      }}
                    >
                      <span className="admin-avatar enquiry-list-avatar">{initials(row.name)}</span>
                      <span className="enquiry-list-copy">
                        <span className="enquiry-row-top">
                          <strong>{row.name}</strong>
                          <time dateTime={row.created_at}>{formatDate(row.created_at, true)}</time>
                        </span>
                        <span className="enquiry-list-topic">{topic(row)}</span>
                        <span className="enquiry-row-bottom">
                          <span className={`enquiry-status ${row.status}`}>
                            {statusLabel(row.status)}
                          </span>
                          <span className="enquiry-brief-preview">
                            {isOverdue(row) ? "Follow-up overdue" : row.brief}
                          </span>
                          {drafts[row.id] !== undefined &&
                            drafts[row.id] !== (row.staff_notes ?? "") && (
                              <span title="Unsaved notes">●</span>
                            )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="admin-empty">
                <Mail size={26} className="mx-auto mb-3 opacity-40" />
                <p>{rows.length ? "No enquiries match your filters." : "No enquiries yet."}</p>
                {rows.length > 0 && (
                  <button
                    className="mt-3 text-primary text-xs"
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                      setOverdue(false);
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
          {more && (
            <div className="enquiry-list-footer">
              <Button
                variant="outline"
                disabled={loadingMore}
                className="w-full !text-xs"
                onClick={loadMore}
              >
                {loadingMore ? "Loading…" : "Load older enquiries"}
              </Button>
            </div>
          )}
          <p className="enquiry-list-footnote">
            {more
              ? "Search covers loaded enquiries. Load older entries to search further."
              : "Showing your loaded enquiries."}{" "}
            Follow-up dates use Namibia time.
          </p>
        </section>
        <section
          ref={detailRef}
          className="admin-panel enquiry-detail"
          aria-label="Selected enquiry"
        >
          {current ? (
            <>
              <header className="enquiry-detail-header">
                <div className="flex items-start gap-3">
                  <span className="admin-avatar">{initials(current.name)}</span>
                  <div className="min-w-0">
                    <p className="enquiry-reference">{topic(current)}</p>
                    <h2>{current.name}</h2>
                    <p className="enquiry-received">{formatDate(current.created_at)}</p>
                  </div>
                </div>
                <AppSelect
                  aria-label="Enquiry status"
                  value={current.status}
                  disabled={working}
                  onChange={(e) => {
                    const status = e.target.value as Status;
                    if (status === "confirmed" && current.booking_ref) {
                      return;
                    }
                    void update(current.id, { status });
                  }}
                >
                  {statuses.map((status) => (
                    <option
                      key={status.value}
                      value={status.value}
                      disabled={
                        status.value === "confirmed" &&
                        !!current.booking_ref &&
                        current.status !== "confirmed"
                      }
                    >
                      {status.label}
                    </option>
                  ))}
                </AppSelect>
              </header>
              {current.booking_ref && (
                <div className="px-6 pb-4">
                  <p className="mb-3 text-xs text-muted-foreground">
                    Booking {current.booking_ref} ·{" "}
                    {current.status === "confirmed"
                      ? "Confirmed — visible in the traveller’s booking status. Travel dates appear in Reservations once scheduled."
                      : current.status === "closed"
                        ? "Closed — visible in the traveller’s booking status."
                        : "Confirm here once availability, price and terms have been agreed. The traveller’s status updates when saved."}
                  </p>
                  {current.status !== "closed" && (
                    <ConfirmBooking
                      key={current.id}
                      enquiry={current}
                      onSaved={(saved) => {
                        setRows((previous) =>
                          previous.map((row) => (row.id === saved.id ? saved : row)),
                        );
                        setFeedback((previous) => ({
                          ...previous,
                          [saved.id]: {
                            ok: true,
                            text: "Booking confirmed and added to the calendar.",
                          },
                        }));
                      }}
                    />
                  )}
                </div>
              )}
              <div className="enquiry-reply-actions">
                {current.email && <a href={`mailto:${current.email}`}>Reply by email ↗</a>}
                {current.phone && (
                  <a href={`tel:${current.phone.replace(/[^+0-9]/g, "")}`}>Call traveller ↗</a>
                )}
              </div>
              <details className="enquiry-extra" key={current.id}>
                <summary>Contact & follow-up details</summary>
                <p className="enquiry-reference mt-4">{reference(current)}</p>
                <dl className="enquiry-contact-grid">
                  {current.email && (
                    <div>
                      <dt>Email</dt>
                      <dd>
                        <a href={`mailto:${current.email}`}>{current.email}</a>
                      </dd>
                    </div>
                  )}
                  {current.phone && (
                    <div>
                      <dt>Phone / WhatsApp</dt>
                      <dd>
                        <a href={`tel:${current.phone.replace(/[^+0-9]/g, "")}`}>{current.phone}</a>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>Preferred contact</dt>
                    <dd>{current.contact_preference || "Not supplied"}</dd>
                  </div>
                  <div>
                    <dt>Country</dt>
                    <dd>{current.residence || "Not supplied"}</dd>
                  </div>
                </dl>
                <div className="enquiry-workflow">
                  <label>
                    Assigned to
                    <AppSelect
                      value={current.assigned_to ?? ""}
                      disabled={working || directoryError}
                      onChange={(e) =>
                        void update(current.id, { assigned_to: e.target.value || null })
                      }
                    >
                      <option value="">Unassigned</option>
                      {current.assigned_to &&
                        !directory.some((person) => person.user_id === current.assigned_to) && (
                          <option value={current.assigned_to}>Team member</option>
                        )}
                      {directory.map((person) => (
                        <option key={person.user_id} value={person.user_id}>
                          {person.email}
                        </option>
                      ))}
                    </AppSelect>
                  </label>
                  <label>
                    Follow up on
                    <input
                      type="date"
                      disabled={working}
                      value={current.follow_up_on ?? ""}
                      onChange={(e) =>
                        void update(current.id, { follow_up_on: e.target.value || null })
                      }
                    />
                  </label>
                </div>
                {directoryError && (
                  <p className="enquiry-inline-feedback" role="alert">
                    The staff list could not be loaded. Refresh to retry.
                  </p>
                )}
              </details>
              {feedback[current.id] && (
                <p
                  className="enquiry-inline-feedback"
                  role={feedback[current.id]!.ok ? "status" : "alert"}
                >
                  {feedback[current.id]!.text}
                </p>
              )}
              <Tabs value={tab} onValueChange={setTab} className="enquiry-detail-tabs">
                <TabsList aria-label="Enquiry details">
                  <TabsTrigger value="brief">Traveller’s message</TabsTrigger>
                  <TabsTrigger value="notes">Team notes{notesChanged ? " •" : ""}</TabsTrigger>
                  <TabsTrigger value="history">More details</TabsTrigger>
                </TabsList>
                <TabsContent value="brief" className="enquiry-tab-content">
                  <h3 className="sr-only">Traveller’s message</h3>
                  <div className="enquiry-message">{current.brief}</div>
                </TabsContent>
                <TabsContent value="notes" className="enquiry-tab-content">
                  <label className="text-xs font-medium" htmlFor="enquiry-team-notes">
                    Private team notes
                  </label>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Keep the context your team needs for the next conversation.
                  </p>
                  <textarea
                    id="enquiry-team-notes"
                    disabled={working}
                    maxLength={10000}
                    rows={7}
                    placeholder="Add useful details for your team…"
                    value={draft}
                    onChange={(e) => {
                      setNoteBases((previous) => ({
                        ...previous,
                        [current.id]: previous[current.id] ?? current.staff_notes ?? "",
                      }));
                      setDrafts((previous) => ({ ...previous, [current.id]: e.target.value }));
                    }}
                  />
                  {notesConflict && (
                    <div className="enquiry-note-conflict" role="alert">
                      <p>
                        Saved notes changed while you were editing. Compare the latest version below
                        before saving your notes.
                      </p>
                      <details>
                        <summary>Latest saved notes</summary>
                        <p>{current.staff_notes || "No saved notes"}</p>
                      </details>
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <Button
                      disabled={working || !notesChanged}
                      className="!text-xs"
                      onClick={() => void saveNotes()}
                    >
                      {working ? "Saving…" : notesConflict ? "Save my notes" : "Save notes"}
                    </Button>
                    {notesChanged && (
                      <Button
                        variant="ghost"
                        disabled={working}
                        className="!text-xs"
                        onClick={() => {
                          setDrafts((previous) => {
                            const next = { ...previous };
                            delete next[current.id];
                            return next;
                          });
                          setNoteBases((previous) => {
                            const next = { ...previous };
                            delete next[current.id];
                            return next;
                          });
                        }}
                      >
                        Discard changes
                      </Button>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="history" className="enquiry-tab-content">
                  {historyLoading ? (
                    <p role="status" className="text-xs text-muted-foreground">
                      Loading activity…
                    </p>
                  ) : historyError ? (
                    <p role="alert" className="text-xs">
                      Activity could not be loaded. Refresh to retry.
                    </p>
                  ) : history.length ? (
                    <ol className="enquiry-timeline">
                      {history.map((event) => (
                        <li key={event.id}>
                          <span className="enquiry-timeline-dot" />
                          <div>
                            <p>
                              <strong>
                                {directory.find((person) => person.user_id === event.actor_id)
                                  ?.email ?? "Team member"}
                              </strong>
                              <time dateTime={event.created_at}>
                                {formatDate(event.created_at)}
                              </time>
                            </p>
                            <ul>
                              {event.previous_status !== event.next_status && (
                                <li>
                                  {statusLabel(event.previous_status)} →{" "}
                                  {statusLabel(event.next_status)}
                                </li>
                              )}
                              {event.notes_changed && <li>Updated team notes</li>}
                              {event.previous_assignee !== event.next_assignee && (
                                <li>
                                  Assigned to{" "}
                                  {directory.find(
                                    (person) => person.user_id === event.next_assignee,
                                  )?.email ??
                                    (event.next_assignee ? "a team member" : "Unassigned")}
                                </li>
                              )}
                              {event.previous_follow_up !== event.next_follow_up && (
                                <li>
                                  {event.next_follow_up
                                    ? `Follow-up set for ${event.next_follow_up}`
                                    : "Cleared follow-up date"}
                                </li>
                              )}
                            </ul>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-muted-foreground">No team updates yet.</p>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="admin-empty">
              <Mail size={28} className="mx-auto mb-4 opacity-40" />
              <h2 className="text-sm font-medium">A clear space for your next conversation.</h2>
              <p className="mt-3 text-xs">
                Select an enquiry from the inbox to see the traveller’s message and next steps.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
