import { AppSelect } from "@/components/ui/app-select";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TravellerItinerary } from "@/components/traveller-itinerary";
import { Section, Strip, meta } from "@/components/site";
import { Button } from "@/components/ui/button";
import { matchInterests, matchSafaris } from "@/lib/safari-match";
export const Route = createFileRoute("/match")({ component: Match, head: () => meta("Safari match", "Find safari inspiration based on your interests, travel style and preferences.") });
function Match() {
  const [interests, setInterests] = useState<string[]>([]);
  const [days, setDays] = useState("");
  const [budget, setBudget] = useState("");
  const [style, setStyle] = useState("Open to suggestions");
  const [ready, setReady] = useState(false);
  const field = "mt-2 w-full border-b bg-transparent py-3";
  return (
    <Section>
      <h1 className="font-display text-5xl">Find your safari</h1>
      <p className="mt-6 text-muted-foreground">
        Match your interests with our catalogue. Pelican will confirm which itinerary fits your
        budget, days and travel style.
      </p>
      <form
        className="mt-8 space-y-8 border-y border-border py-8"
        onSubmit={(e) => {
          e.preventDefault();
          setReady(true);
        }}
      >
        <fieldset>
          <legend className="text-lg font-semibold">What would you like to experience?</legend>
          <div className="mt-4 flex flex-wrap gap-3">
            {matchInterests.map((x) => (
              <label key={x} className="cursor-pointer">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={interests.includes(x)}
                  onChange={() => {
                    setReady(false);
                    setInterests(
                      interests.includes(x) ? interests.filter((v) => v !== x) : [...interests, x],
                    );
                  }}
                />
                <span className="inline-flex min-h-11 items-center rounded-full border border-border px-5 py-2 text-sm transition-colors hover:border-primary peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                  {x}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-6 md:grid-cols-3">
          <label>
            Available days
            <input
              className={field}
              type="number"
              min="1"
              max="90"
              value={days}
              onChange={(e) => {
                setDays(e.target.value);
                setReady(false);
              }}
            />
          </label>
          <label>
            Budget per person (NAD)
            <input
              className={field}
              type="number"
              min="1"
              max="10000000"
              value={budget}
              onChange={(e) => {
                setBudget(e.target.value);
                setReady(false);
              }}
            />
          </label>
          <label>
            Travel style
            <AppSelect
              className={field}
              value={style}
              onChange={(e) => {
                setStyle(e.target.value);
                setReady(false);
              }}
            >
              {["Open to suggestions", "Private guided", "Small group"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </AppSelect>
          </label>
        </div>
        <Button type="submit">See safari inspiration</Button>
      </form>
      {ready && (
        <div className="mt-12">
          <h2 className="text-3xl font-semibold">Your safari matches</h2>
          <p className="mt-3 text-muted-foreground">Ranked by shared interests only; price, availability and duration require a quote.</p>
          <div className="mt-7 grid gap-8 md:grid-cols-2">
            {matchSafaris(interests).map(({ safari, matched }, index) => (
              <article key={safari.slug} className="group border-b border-border pb-7">
                <Strip
                  animateOnHover
                  src={safari.image}
                  shape={index % 2 ? "left" : "right"}
                  sizes="(min-width: 768px) 46vw, calc(100vw - 40px)"
                  className="h-44 w-full md:h-52"
                />
                <h3 className="mt-5 text-2xl font-semibold tracking-tight group-hover:text-clay">{safari.name}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(matched.length ? matched : ["Explore this safari"]).map((label) => (
                    <span key={label} className="rounded-full bg-muted px-3 py-1 text-xs">{label}</span>
                  ))}
                </div>
                <Link
                  className="mt-5 inline-block font-medium text-primary"
                  to="/tailor-made"
                  search={{
                    safari: safari.slug,
                    preferences: JSON.stringify({ days, budget, style, interests }),
                  }}
                >
                  Plan this safari →
                </Link>
              </article>
            ))}
          </div>
          <Link className="mt-6 block underline" to="/shortlist" search={{ saved: "[]" }}>
            Save and compare choices →
          </Link>
        </div>
      )}
      <TravellerItinerary />
    </Section>
  );
}
