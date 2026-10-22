import { AppSelect } from "@/components/ui/app-select";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Section } from "@/components/site";
import { Button } from "@/components/ui/button";
import { destinations, stays } from "@/lib/pelican";
import { validateJourney, type JourneyStop } from "@/lib/journey";
type Trip = Database["public"]["Tables"]["trips"]["Row"];
export const Route = createFileRoute("/_authenticated/trips-manage")({
  head: () => ({
    meta: [{ title: "Manage trips — Pelican" }, { name: "robots", content: "noindex" }],
  }),
  component: ManageTrips,
});
function ManageTrips() {
  const [rows, setRows] = useState<Trip[]>([]);
  const [staff, setStaff] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<Trip>();
  const [traveller, setTraveller] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<Trip["status"]>("draft");
  const [stops, setStops] = useState<JourneyStop[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      const { data: roles, error: r } = await supabase.from("user_roles").select("role");
      if (r) throw r;
      const ok = !!roles?.some((r) => r.role === "staff" || r.role === "admin");
      setStaff(ok);
      if (ok) {
        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) throw error;
        setRows(data ?? []);
      }
    } catch {
      setMessage("Trips could not be loaded. Check the database deployment and try again.");
    } finally {
      setLoaded(true);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const edit = (t?: Trip) => {
    setEditing(t);
    setTraveller(t?.traveller_id ?? "");
    setTitle(t?.title ?? "");
    setDate(t?.starts_on ?? "");
    setStatus(t?.status ?? "draft");
    setStops(t ? validateJourney(t.stops) : []);
    setMessage("");
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(traveller) ||
      !stops.length
    ) {
      setMessage("Enter a valid traveller account ID and at least one stop.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const payload = {
        traveller_id: traveller,
        title: title.trim(),
        starts_on: date,
        status,
        stops: stops.map((s) => ({ ...s })),
      };
      const result = editing
        ? await supabase
            .from("trips")
            .update(payload)
            .eq("id", editing.id)
            .eq("updated_at", editing.updated_at)
            .select()
            .single()
        : await supabase.from("trips").insert(payload).select().single();
      if (result.error || !result.data) throw new Error("Save failed");
      setEditing(result.data);
      await load();
      setMessage(
        "Trip saved. Confirmed and cancelled trips are visible to the assigned traveller.",
      );
    } catch {
      setMessage(
        "Trip was not saved. Verify the account exists; reload before retrying if another staff member changed this trip.",
      );
    } finally {
      setBusy(false);
    }
  };
  const field = "mt-2 block w-full border-b bg-transparent py-3";
  if (!loaded)
    return (
      <Section>
        <p>Loading…</p>
      </Section>
    );
  if (!staff)
    return (
      <Section>
        <h1 className="text-4xl">Staff access required</h1>
        <p role="alert" className="mt-4">
          {message}
        </p>
      </Section>
    );
  return (
    <Section>
      <h1 className="text-5xl font-bold">Manage traveller trips</h1>
      <p className="mt-6 text-muted-foreground">
        Record supplier-confirmed accommodation only. Setting an enquiry to Confirmed does not
        create a booking here.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="outline" disabled={busy} onClick={() => edit()}>
          New trip
        </Button>
        <Button variant="ghost" onClick={load} disabled={busy}>
          Reload trips
        </Button>
        <Link to="/dashboard" className="py-3 text-primary">
          Enquiries →
        </Link>
      </div>
      <ul className="mt-6 divide-y border-y border-border">
        {rows.map((t) => (
          <li key={t.id} className="py-3">
            <button className="text-primary" onClick={() => edit(t)} disabled={busy}>
              {t.title} · {t.starts_on} · {t.status}
            </button>
          </li>
        ))}
      </ul>
      <form className="mt-8 space-y-5 max-w-2xl" onSubmit={save}>
        <fieldset disabled={busy} className="space-y-5">
          <label className="block">
            Traveller account ID
            <input
              required
              value={traveller}
              onChange={(e) => setTraveller(e.target.value)}
              className={field}
            />
          </label>
          <label className="block">
            Trip title
            <input
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={field}
            />
          </label>
          <label className="block">
            Start date
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={field}
            />
          </label>
          <label className="block">
            Booking status
            <AppSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as Trip["status"])}
              className={field}
            >
              <option value="draft">Draft — staff only</option>
              <option value="confirmed">Confirmed by Pelican</option>
              <option value="cancelled">Cancelled</option>
            </AppSelect>
          </label>
          <ol className="divide-y border-y border-border">
            {stops.map((s, i) => (
              <li key={i} className="py-4">
                <label>
                  Destination
                  <AppSelect
                    className={field}
                    value={s.destination}
                    onChange={(e) =>
                      setStops(
                        stops.map((v, j) =>
                          j === i ? { destination: e.target.value, nights: v.nights } : v,
                        ),
                      )
                    }
                  >
                    {destinations.map((d) => (
                      <option key={d.slug} value={d.slug}>
                        {d.name}
                      </option>
                    ))}
                  </AppSelect>
                </label>
                <label className="mt-3 block">
                  Confirmed accommodation
                  <AppSelect
                    className={field}
                    value={s.stay ?? ""}
                    onChange={(e) =>
                      setStops(
                        stops.map((v, j) =>
                          j === i
                            ? {
                                destination: v.destination,
                                nights: v.nights,
                                ...(e.target.value ? { stay: e.target.value } : {}),
                              }
                            : v,
                        ),
                      )
                    }
                  >
                    <option value="">Destination stop only</option>
                    {stays
                      .filter((t) => t.destination === s.destination)
                      .map((t) => (
                        <option key={t.slug} value={t.slug}>
                          {t.name}
                        </option>
                      ))}
                  </AppSelect>
                </label>
                <label className="mt-3 block">
                  Nights
                  <input
                    type="number"
                    required
                    min={1}
                    max={90}
                    step={1}
                    value={s.nights}
                    className={field}
                    onChange={(e) =>
                      setStops(
                        stops.map((v, j) =>
                          j === i
                            ? {
                                ...v,
                                nights: Math.max(
                                  1,
                                  Math.min(90, Math.floor(Number(e.target.value) || 1)),
                                ),
                              }
                            : v,
                        ),
                      )
                    }
                  />
                </label>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={!i}
                    onClick={() => {
                      const n = [...stops];
                      [n[i - 1], n[i]] = [n[i]!, n[i - 1]!];
                      setStops(n);
                    }}
                  >
                    Earlier
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStops(stops.filter((_, j) => j !== i))}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="outline"
            disabled={stops.length >= 30 || busy}
            onClick={() => setStops([...stops, { destination: "windhoek", nights: 1 }])}
          >
            Add stop
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save trip"}
          </Button>
        </fieldset>
      </form>
      <p role="status" className="mt-6 text-sm text-muted-foreground">
        {message}
      </p>
    </Section>
  );
}
