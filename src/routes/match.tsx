import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Section } from "@/components/site";
import { Button } from "@/components/ui/button";
import { matchInterests, matchSafaris } from "@/lib/safari-match";
export const Route = createFileRoute("/match")({ component: Match });
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
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setReady(true);
        }}
      >
        <fieldset>
          <legend>Your interests</legend>
          <div className="mt-4 flex flex-wrap gap-6">
            {matchInterests.map((x) => (
              <label key={x}>
                <input
                  type="checkbox"
                  className="mr-2 accent-primary"
                  checked={interests.includes(x)}
                  onChange={() => {
                    setReady(false);
                    setInterests(
                      interests.includes(x) ? interests.filter((v) => v !== x) : [...interests, x],
                    );
                  }}
                />
                {x}
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
            <select
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
            </select>
          </label>
        </div>
        <Button type="submit">See safari inspiration</Button>
      </form>
      {ready && (
        <div className="mt-10">
          <p>Ranked by shared interests only; price, availability and duration require a quote.</p>
          {matchSafaris(interests).map(({ safari, matched }) => (
            <div key={safari.slug} className="border-b py-6">
              <h2 className="text-2xl">{safari.name}</h2>
              <p className="my-3">{matched.length ? matched.join(", ") : "Explore this safari"}</p>
              <Link
                className="underline"
                to="/tailor-made"
                search={{
                  safari: safari.slug,
                  preferences: JSON.stringify({ days, budget, style, interests }),
                }}
              >
                Plan this safari →
              </Link>
            </div>
          ))}
          <Link className="mt-6 block underline" to="/shortlist" search={{ saved: "[]" }}>
            Save and compare choices →
          </Link>
        </div>
      )}
    </Section>
  );
}
