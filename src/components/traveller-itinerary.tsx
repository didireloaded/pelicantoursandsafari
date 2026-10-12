import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { destinations } from "@/lib/pelican";
import {
  itineraryDays,
  plannerInterests,
  plannerSchema,
  type PlannerInput,
  type TravellerPlan,
} from "@/lib/traveller-itinerary";
export function TravellerItinerary() {
  const [destination, setDestination] = useState("etosha");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState<{ input: PlannerInput; plan: TravellerPlan }>();
  const [message, setMessage] = useState("");
  const [signIn, setSignIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const field = "mt-2 w-full border-b bg-transparent py-3";
  const reset = () => {
    setResult(undefined);
    setMessage("");
    setSignIn(false);
  };
  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    reset();
    const parsed = plannerSchema.safeParse({
      destination,
      start,
      end,
      interests,
      budget: Number(budget),
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Check your travel preferences.");
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const session = await supabase.auth.getSession();
      if (session.error || !session.data.session) {
        setSignIn(true);
        setMessage(
          "Sign in to generate your itinerary. Your unsaved preferences remain here while this page stays open.",
        );
        return;
      }
      const response = await supabase.functions.invoke("plan-safari", {
        body: parsed.data,
        signal: AbortSignal.timeout(55000),
      });
      if (response.error) {
        let errorMessage =
          "AI planning is unavailable. Please try later; the safari quiz still works.";
        if (response.error.context instanceof Response) {
          try {
            const body = await response.error.context.json();
            if (typeof body.error === "string") errorMessage = body.error;
          } catch {
            /* Keep the safe fallback. */
          }
          if (response.error.context.status === 401) setSignIn(true);
        }
        throw new Error(errorMessage);
      }
      const plan = response.data?.plan as TravellerPlan | undefined;
      if (
        !plan ||
        !Array.isArray(plan.days) ||
        plan.days.length !== itineraryDays(parsed.data) ||
        plan.days.some(
          (day) =>
            typeof day.date !== "string" ||
            typeof day.title !== "string" ||
            typeof day.description !== "string" ||
            !Array.isArray(day.interests) ||
            day.interests.some((x) => !parsed.data.interests.includes(x)),
        )
      )
        throw new Error("The AI plan could not be verified. Please try again.");
      setResult({ input: parsed.data, plan });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "AI planning is unavailable. Please try later.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="mt-16 border-t pt-10">
      <h2 className="font-display text-3xl">Create an AI safari itinerary</h2>
      <p className="mt-4 text-muted-foreground">
        Choose your destination, dates, interests and total budget per person. AI will arrange
        catalogue inspiration into a provisional daily plan. Pelican must confirm feasibility,
        prices and availability; this is not a quote or reservation.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        When you generate, these preferences are sent to Lovable AI. Do not include personal contact
        details. Plans stay on this page and are not saved to your account. Sign-in is required; up
        to three plans per hour, subject to the shared daily limit.
      </p>
      <form className="mt-8 space-y-6" onSubmit={generate} aria-busy={busy}>
        <fieldset disabled={busy} className="space-y-6">
          <label className="block">
            Destination
            <select
              className={field}
              value={destination}
              onChange={(e) => {
                reset();
                setDestination(e.target.value);
              }}
            >
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-6 md:grid-cols-3">
            <label>
              Start date
              <input
                className={field}
                type="date"
                required
                value={start}
                onChange={(e) => {
                  reset();
                  setStart(e.target.value);
                }}
              />
            </label>
            <label>
              End date
              <input
                className={field}
                type="date"
                required
                min={start}
                value={end}
                onChange={(e) => {
                  reset();
                  setEnd(e.target.value);
                }}
              />
            </label>
            <label>
              Total budget per person (NAD)
              <input
                className={field}
                type="number"
                required
                min="1"
                max="10000000"
                step="1"
                value={budget}
                onChange={(e) => {
                  reset();
                  setBudget(e.target.value);
                }}
              />
            </label>
          </div>
          <fieldset>
            <legend>Interests</legend>
            <div className="mt-4 flex flex-wrap gap-6">
              {plannerInterests.map((interest) => (
                <label key={interest}>
                  <input
                    type="checkbox"
                    className="mr-2 accent-primary"
                    checked={interests.includes(interest)}
                    onChange={() => {
                      reset();
                      setInterests(
                        interests.includes(interest)
                          ? interests.filter((x) => x !== interest)
                          : [...interests, interest],
                      );
                    }}
                  />
                  {interest}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" disabled={busy}>
            {busy ? "Creating your itinerary…" : "Generate itinerary"}
          </Button>
        </fieldset>
      </form>
      <p role="status" className="mt-4">
        {message}
      </p>
      {signIn && (
        <Link
          className="underline"
          to="/auth"
          search={{ next: "/match" }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Sign in in a new tab, then return here →
        </Link>
      )}
      {result && (
        <div className="mt-8" aria-live="polite">
          <h3 className="text-2xl">Your provisional itinerary</h3>
          <p className="mt-3">
            Requested budget: NAD {result.input.budget.toLocaleString()} per person for the trip.
            Affordability is unverified. Suggested days are flexible inspiration, not confirmed
            safari durations, transfers or bookings.
          </p>
          {result.plan.days.map((day, index) => (
            <article className="border-b py-6" key={day.date}>
              <h4 className="text-xl">
                Day {index + 1} · {day.date} · {day.title}
              </h4>
              <p className="mt-3">{day.description}</p>
              <p className="mt-2 text-sm">
                Your interests: {day.interests.join(", ") || "Flexible exploration"}
              </p>
            </article>
          ))}
          <Link
            className="mt-6 block underline"
            to="/tailor-made"
            search={{
              destinations: result.input.destination,
              preferences: JSON.stringify({
                days: String(itineraryDays(result.input)),
                budget: String(result.input.budget),
                interests: result.input.interests,
              }),
            }}
          >
            Ask Pelican to refine these preferences →
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            This transfers destination, interests, days and budget only. Copy your daily plan if you
            want to include it in the brief.
          </p>
        </div>
      )}
    </div>
  );
}
