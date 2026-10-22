import { AppSelect } from "@/components/ui/app-select";
import { useRef, useState } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { ZodError } from "zod";
import { useWorkspace, saveBooking } from "@/lib/admin-workspace-api";
import {
  addDays,
  dayUtc,
  tripEnd,
  initials,
  blankBooking,
  type AdminTrip,
  type BookingInput,
} from "@/lib/admin-workspace";
import { validateJourney } from "@/lib/journey";
import { destinations, stays } from "@/lib/pelican";
import { formatNad } from "@/lib/safari-package";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { WorkspaceState } from "./workspace-state";
export function Bookings() {
  const query = useWorkspace();
  const cache = useQueryClient();
  const data = query.data;
  const today = dayUtc();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState("");
  const [day, setDay] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTrip>();
  const [form, setForm] = useState<BookingInput>(blankBooking);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const id = useRef<string>(crypto.randomUUID());
  useBlocker({
    shouldBlockFn: () => busy || (dirty && !window.confirm("Discard unsaved reservation changes?")),
    enableBeforeUnload: () => dirty || busy,
  });
  const rows = (data?.trips ?? [])
    .filter(
      (t) => (!status || t.status === status) && (!day || (t.starts_on <= day && tripEnd(t) > day)),
    )
    .sort((a, b) => a.starts_on.localeCompare(b.starts_on));
  const current =
    rows.find((t) => t.id === selected) ?? rows.find((t) => tripEnd(t) >= today) ?? rows[0];
  const client = data?.clients.find((c) => c.id === current?.client_id);
  const first = `${month}-01`;
  const start = addDays(first, -((new Date(first + "T00:00:00Z").getUTCDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const change = (patch: Partial<BookingInput>) => {
    setForm((old) => ({ ...old, ...patch }));
    setDirty(true);
  };
  const edit = (trip?: AdminTrip) => {
    setEditing(trip);
    setForm(
      trip
        ? {
            client_id: trip.client_id ?? "",
            traveller_id: trip.traveller_id,
            title: trip.title,
            starts_on: trip.starts_on,
            status: trip.status as BookingInput["status"],
            stops: validateJourney(trip.stops),
            total_nad: trip.total_nad,
            paid_nad: trip.paid_nad,
          }
        : blankBooking(),
    );
    id.current = trip?.id ?? crypto.randomUUID();
    setMessage("");
    setDirty(false);
    setOpen(true);
  };
  async function save() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      const result = await saveBooking(id.current, editing?.updated_at ?? null, form);
      await cache.invalidateQueries({ queryKey: ["admin-workspace"] });
      setSelected(result.id);
      setDirty(false);
      setOpen(false);
    } catch (error) {
      setMessage(
        error instanceof ZodError
          ? (error.issues[0]?.message ?? "Check the booking details.")
          : (error as Error).message,
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  const move = (index: number, offset: number) => {
    const stops = [...form.stops];
    const next = index + offset;
    if (next < 0 || next >= stops.length) return;
    [stops[index], stops[next]] = [stops[next]!, stops[index]!];
    change({ stops });
  };
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">DATES, GUESTS & THE DETAILS</p>
          <h1 className="mt-2">Reservations</h1>
          <p>
            Keep confirmed journeys distinct from draft requests. This is your staff-maintained
            booking calendar.
          </p>
        </div>
        <Button className="gap-2 !text-xs" onClick={() => edit()}>
          <Plus size={15} />
          New reservation
        </Button>
      </div>
      <WorkspaceState
        loading={query.isPending}
        error={query.isError}
        retry={() => void query.refetch()}
      >
        <div className="admin-stats">
          {[
            ["Confirmed bookings", data?.trips.filter((t) => t.status === "confirmed").length ?? 0],
            ["Draft requests", data?.trips.filter((t) => t.status === "draft").length ?? 0],
            [
              "Travelling today",
              data?.trips.filter(
                (t) => t.status === "confirmed" && t.starts_on <= today && tripEnd(t) > today,
              ).length ?? 0,
            ],
            [
              "Future departures",
              data?.trips.filter((t) => t.status === "confirmed" && t.starts_on > today).length ??
                0,
            ],
          ].map(([name, value]) => (
            <div key={name} className="admin-panel admin-stat">
              <p className="admin-stat-label">{name}</p>
              <p className="admin-stat-value">{value}</p>
              <p className="admin-stat-note">From recorded trip status and dates</p>
            </div>
          ))}
        </div>
        <div className="admin-main-grid">
          <section className="admin-panel p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="admin-tabs">
                <button
                  className={`admin-pill ${view === "calendar" ? "is-selected" : ""}`}
                  onClick={() => {
                    setDay("");
                    setView("calendar");
                  }}
                >
                  Calendar
                </button>
                <button
                  className={`admin-pill ${view === "list" ? "is-selected" : ""}`}
                  onClick={() => setView("list")}
                >
                  Reservations
                </button>
              </div>
              <AppSelect
                aria-label="Reservation status"
                className="admin-pill"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="draft">Draft requests</option>
                <option value="cancelled">Cancelled</option>
              </AppSelect>
            </div>
            {day && (
              <button className="mb-4 text-[11px] text-primary" onClick={() => setDay("")}>
                Showing {day} · clear date filter
              </button>
            )}
            {view === "calendar" ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <label className="font-medium">
                    <span className="sr-only">Calendar month</span>
                    <input
                      type="month"
                      min="2000-01"
                      max="2100-12"
                      value={month}
                      onChange={(e) => {
                        if (/^\d{4}-\d{2}$/.test(e.target.value)) setMonth(e.target.value);
                      }}
                      className="bg-transparent text-sm"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      className="admin-pill !p-2"
                      aria-label="Previous month"
                      onClick={() => {
                        const d = new Date(first + "T00:00:00Z");
                        d.setUTCMonth(d.getUTCMonth() - 1);
                        setMonth(dayUtc(d).slice(0, 7));
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      className="admin-pill"
                      onClick={() => {
                        setMonth(today.slice(0, 7));
                        setDay("");
                      }}
                    >
                      Today
                    </button>
                    <button
                      className="admin-pill !p-2"
                      aria-label="Next month"
                      onClick={() => {
                        const d = new Date(first + "T00:00:00Z");
                        d.setUTCMonth(d.getUTCMonth() + 1);
                        setMonth(dayUtc(d).slice(0, 7));
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="admin-calendar-scroll">
                  <div className="admin-calendar-inner">
                    <div className="grid grid-cols-7">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
                        <span className="admin-calendar-weekday" key={w}>
                          {w}
                        </span>
                      ))}
                    </div>
                    <div className="admin-calendar-grid">
                      {days.map((date) => {
                        const trips = rows.filter(
                          (t) =>
                            t.status !== "cancelled" && t.starts_on <= date && tripEnd(t) > date,
                        );
                        return (
                          <div
                            key={date}
                            className={`admin-calendar-cell ${date === today ? "is-today" : ""} ${!date.startsWith(month) ? "opacity-45" : ""}`}
                          >
                            <button
                              className="admin-calendar-day"
                              aria-label={`Show reservations on ${date}`}
                              onClick={() => {
                                setDay(date);
                                setSelected(trips[0]?.id ?? "");
                                setView("list");
                              }}
                            >
                              {Number(date.slice(-2))}
                            </button>
                            {trips.slice(0, 3).map((trip) => (
                              <button
                                className={`admin-calendar-item ${trip.status}`}
                                title={`${trip.title} · ${trip.status}`}
                                key={trip.id}
                                onClick={() => {
                                  setDay(date);
                                  setSelected(trip.id);
                                  setView("list");
                                }}
                              >
                                {trip.title}
                              </button>
                            ))}
                            {trips.length > 3 && (
                              <button
                                className="mt-1 text-[9px] text-primary"
                                onClick={() => {
                                  setDay(date);
                                  setView("list");
                                }}
                              >
                                +{trips.length - 3} more
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-[10px] text-muted-foreground">
                  Green: confirmed · Sand: draft request. Cancelled trips remain in the reservation
                  list.
                </p>
              </>
            ) : (
              <div>
                {rows.length ? (
                  rows.map((trip) => (
                    <button
                      key={trip.id}
                      className="admin-row w-full text-left"
                      onClick={() => setSelected(trip.id)}
                    >
                      <span className="admin-avatar !h-9 !w-9 !text-xs">
                        {initials(
                          data?.clients.find((c) => c.id === trip.client_id)?.name ?? trip.title,
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-xs font-medium">{trip.title}</strong>
                        <small className="text-[10px] text-muted-foreground">
                          {trip.starts_on} — {tripEnd(trip)}
                        </small>
                      </span>
                      <span className={`admin-status ${trip.status}`}>{trip.status}</span>
                    </button>
                  ))
                ) : (
                  <div className="admin-empty">No reservations match these filters.</div>
                )}
              </div>
            )}
            {!data?.trips.length && (
              <p className="mt-5 text-center text-xs text-muted-foreground">
                No reservations recorded yet. Start with a client, then create a draft request.
              </p>
            )}
          </section>
          <aside className="admin-detail-rail">
            <section className="admin-panel p-6">
              <h2 className="admin-panel-heading">Reservation details</h2>
              {current ? (
                <>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="admin-avatar">{initials(client?.name ?? current.title)}</span>
                    <div>
                      <h3 className="text-sm font-medium">{client?.name ?? "Traveller account"}</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {client?.country || "Country not supplied"}
                      </p>
                    </div>
                  </div>
                  <h3 className="mt-5 text-lg font-medium">{current.title}</h3>
                  <span className={`admin-status mt-3 inline-block ${current.status}`}>
                    {current.status}
                  </span>
                  <dl className="mt-6 space-y-4 text-[11px]">
                    {[
                      ["Departure", current.starts_on],
                      ["Return", tripEnd(current)],
                      [
                        "Trip total",
                        current.total_nad === null ? "Not recorded" : formatNad(current.total_nad),
                      ],
                      [
                        "Received",
                        current.paid_nad === null ? "Not recorded" : formatNad(current.paid_nad),
                      ],
                    ].map(([key, value]) => (
                      <div className="flex justify-between gap-4" key={key}>
                        <dt className="text-muted-foreground">{key}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-6 border-t border-border pt-5">
                    <h4 className="text-[10px] font-medium">Journey stops</h4>
                    {validateJourney(current.stops).map((stop, i) => (
                      <p className="mt-2 text-[11px] text-muted-foreground" key={i}>
                        {destinations.find((d) => d.slug === stop.destination)?.name} ·{" "}
                        {stop.nights} {stop.nights === 1 ? "night" : "nights"}
                      </p>
                    ))}
                  </div>
                  <Button className="mt-6 w-full gap-2 !text-xs" onClick={() => edit(current)}>
                    Edit reservation
                    <ArrowUpRight size={14} />
                  </Button>
                </>
              ) : (
                <p className="mt-5 text-xs text-muted-foreground">
                  Choose a reservation to see dates, client and recorded amounts.
                </p>
              )}
            </section>
            <section className="admin-panel p-5">
              <h2 className="admin-panel-heading">Before confirming</h2>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Confirm supplier availability and written price/payment terms with the traveller.
                This calendar does not check live availability or process payments.
              </p>
              <Link to="/admin/clients" className="mt-4 inline-block text-[11px] text-primary">
                Open client directory →
              </Link>
            </section>
          </aside>
        </div>
      </WorkspaceState>
      <Sheet
        open={open}
        onOpenChange={(value) => {
          if (busy) return;
          if (!value && dirty && !window.confirm("Discard unsaved reservation changes?")) return;
          setOpen(value);
          if (!value) setDirty(false);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit reservation" : "New reservation"}</SheetTitle>
            <SheetDescription>
              Record the agreed details. A draft is not a confirmed booking.
            </SheetDescription>
          </SheetHeader>
          <form
            className="admin-form mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <fieldset disabled={busy} className="space-y-4">
              <label>
                Client
                <AppSelect
                  required
                  value={form.client_id}
                  onChange={(e) => change({ client_id: e.target.value })}
                >
                  <option value="">Choose a client</option>
                  {data?.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.archived ? " (archived)" : ""}
                    </option>
                  ))}
                </AppSelect>
              </label>
              <label>
                Journey title
                <input
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(e) => change({ title: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  Departure date
                  <input
                    type="date"
                    required
                    value={form.starts_on}
                    onChange={(e) => change({ starts_on: e.target.value })}
                  />
                </label>
                <label>
                  Status
                  <AppSelect
                    value={form.status}
                    onChange={(e) => change({ status: e.target.value as BookingInput["status"] })}
                  >
                    <option value="draft">Draft request</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </AppSelect>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["total_nad", "Agreed total (NAD)"],
                    ["paid_nad", "Received (NAD)"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      min="0"
                      max="100000000"
                      step="0.01"
                      placeholder="Not recorded"
                      value={form[key] ?? ""}
                      onChange={(e) =>
                        change({ [key]: e.target.value === "" ? null : Number(e.target.value) })
                      }
                    />
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Amounts are staff records only. No payment is collected here.
              </p>
              <fieldset className="space-y-4 rounded-xl border border-border p-4">
                <legend className="px-2 text-xs">Journey stops</legend>
                {form.stops.map((stop, i) => (
                  <div key={i} className="space-y-3 border-b border-border pb-4">
                    <label>
                      Destination {i + 1}
                      <AppSelect
                        value={stop.destination}
                        onChange={(e) =>
                          change({
                            stops: form.stops.map((s, j) =>
                              j === i ? { destination: e.target.value, nights: s.nights } : s,
                            ),
                          })
                        }
                      >
                        {destinations.map((d) => (
                          <option key={d.slug} value={d.slug}>
                            {d.name}
                          </option>
                        ))}
                      </AppSelect>
                    </label>
                    <label>
                      Accommodation (optional)
                      <AppSelect
                        value={stop.stay ?? ""}
                        onChange={(e) =>
                          change({
                            stops: form.stops.map((s, j) =>
                              j === i
                                ? {
                                    destination: s.destination,
                                    nights: s.nights,
                                    ...(e.target.value ? { stay: e.target.value } : {}),
                                  }
                                : s,
                            ),
                          })
                        }
                      >
                        <option value="">Confirm with Pelican</option>
                        {stays
                          .filter((s) => s.destination === stop.destination)
                          .map((s) => (
                            <option key={s.slug} value={s.slug}>
                              {s.name}
                            </option>
                          ))}
                      </AppSelect>
                    </label>
                    <label>
                      Nights
                      <input
                        type="number"
                        required
                        min="1"
                        max="90"
                        step="1"
                        value={stop.nights}
                        onChange={(e) =>
                          change({
                            stops: form.stops.map((s, j) =>
                              j === i ? { ...s, nights: Number(e.target.value) } : s,
                            ),
                          })
                        }
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!i}
                        className="admin-pill"
                        aria-label={`Move stop ${i + 1} earlier`}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={i === form.stops.length - 1}
                        className="admin-pill"
                        aria-label={`Move stop ${i + 1} later`}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        className="text-[10px] text-muted-foreground"
                        onClick={() => change({ stops: form.stops.filter((_, j) => i !== j) })}
                      >
                        Remove stop
                      </button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  type="button"
                  disabled={form.stops.length >= 30}
                  onClick={() =>
                    change({ stops: [...form.stops, { destination: "etosha", nights: 1 }] })
                  }
                >
                  Add stop
                </Button>
              </fieldset>
              <details>
                <summary className="cursor-pointer text-xs">
                  Link a traveller account (optional)
                </summary>
                <label className="mt-3">
                  Verified traveller account ID
                  <input
                    placeholder="UUID from the verified traveller account"
                    value={form.traveller_id ?? ""}
                    onChange={(e) => change({ traveller_id: e.target.value || null })}
                  />
                </label>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Only link an account after checking the traveller’s identity. Offline clients can
                  leave this empty. Linking makes confirmed/cancelled trips visible to that account.
                </p>
              </details>
              <Button className="w-full" type="submit">
                {busy ? "Saving…" : "Save reservation"}
              </Button>
            </fieldset>
            <p role="status" className="text-xs">
              {message}
            </p>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
