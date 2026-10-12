import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Section } from "@/components/site";
import { JourneyMap } from "@/components/journey-map";
import { JourneyDistances } from "@/components/journey-distances";
import { checkTravellerSession } from "@/lib/traveller-session";
import { validateJourney } from "@/lib/journey";
import { stopName, type RoadRoute } from "@/lib/journey-geography";
type Trip = Database["public"]["Tables"]["trips"]["Row"];
export const Route = createFileRoute("/trips")({
  ssr: false,
  head: () => ({ meta: [{ title: "My trips — Pelican" }, { name: "robots", content: "noindex" }] }),
  pendingMs: 0,
  pendingComponent: () => <Section><h1 className="text-5xl font-bold">My trips</h1><p className="mt-8" role="status">Checking your sign-in…</p></Section>,
  beforeLoad: async () => {
    const { data, error } = await checkTravellerSession(() => supabase.auth.getUser());
    if (error || !data.user) throw redirect({ to: "/auth", search: { next: "/trips" } });
    return { user: data.user };
  },
  component: Trips,
});
function Trips() {
  const { user } = Route.useRouteContext();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [road, setRoad] = useState<RoadRoute>();
  const select = useCallback(() => {}, []);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("traveller_id", user.id)
        .in("status", ["confirmed", "cancelled"])
        .order("starts_on");
      if (error) throw error;
      setTrips(data ?? []);
    } catch {
      setError("Your trips could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [user.id]);
  const trip = trips.find((t) => t.id === selected) ?? trips[0];
  const stops = validateJourney(trip?.stops);
  return (
    <Section>
      <h1 className="text-5xl font-bold">My trips</h1>
      <p className="mt-6 text-muted-foreground">
        Only trips assigned to your account by Pelican appear here. Journey preferences are not
        confirmed bookings.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Your account ID: {user.id}. Share it with Pelican to have your confirmed itinerary assigned.
      </p>
      {loading ? (
        <p className="mt-8">Loading trips…</p>
      ) : error ? (
        <div role="alert" className="mt-8">
          <p>{error}</p>
          <button className="mt-3 text-primary" onClick={load}>
            Try again
          </button>
        </div>
      ) : !trip ? (
        <p className="mt-8">
          No confirmed trips yet. Contact Pelican if you have a booking awaiting assignment.
        </p>
      ) : (
        <>
          <label className="mt-8 block">
            Select trip
            <select
              className="mt-2 block w-full border-b bg-transparent py-3"
              value={trip.id}
              onChange={(e) => {
                setSelected(e.target.value);
                setRoad(undefined);
              }}
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} · {t.starts_on}
                </option>
              ))}
            </select>
          </label>
          <h2 className="mt-8 text-3xl font-semibold">{trip.title}</h2>
          <p className="mt-3">
            {trip.status === "cancelled"
              ? "Cancelled — this itinerary is no longer an active booking."
              : `Confirmed by Pelican · starts ${trip.starts_on}`}
          </p>
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <JourneyMap
              stops={stops}
              onSelect={select}
              roadRoute={road}
              confirmed={trip.status === "confirmed"}
            />
            <div>
              <ol className="divide-y border-y border-border">
                {stops.map((s, i) => (
                  <li key={i} className="py-4">
                    {i + 1}. {stopName(s)} · {s.nights} nights
                  </li>
                ))}
              </ol>
              <JourneyDistances stops={stops} onRoute={setRoad} />
            </div>
          </div>
        </>
      )}
      <Link to="/contact" className="mt-8 block text-primary">
        Contact Pelican →
      </Link>
    </Section>
  );
}
