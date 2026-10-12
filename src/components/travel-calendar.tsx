import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { destinations } from "@/lib/pelican";
import { calendarGuidance, travelMonths } from "@/lib/travel-calendar";

export function TravelCalendar() {
  const [destination, setDestination] = useState("etosha");
  const [month, setMonth] = useState("");
  const guidance = calendarGuidance(destination, Number(month));
  const field =
    "mt-2 w-full border-b border-foreground/25 bg-transparent py-3 outline-none focus:border-primary";
  return (
    <section
      id="travel-calendar"
      className="mt-10 scroll-mt-28 border-y border-border py-8"
      aria-labelledby="travel-calendar-heading"
    >
      <h2 id="travel-calendar-heading" className="text-3xl font-semibold">
        When would you like to travel?
      </h2>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        Explore seasonal conditions before choosing your dates. This calendar is planning guidance,
        not a weather forecast, availability calendar or wildlife guarantee.
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 print:hidden">
        <label>
          Calendar destination
          <select
            className={field}
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          >
            {destinations.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Travel month
          <select
            className={field}
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          >
            <option value="">Choose a month</option>
            {travelMonths.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p role="status" className="mt-6 font-semibold">
        {guidance?.heading ?? "Choose a month to see guidance for your destination."}
      </p>
      {guidance && (
        <div className="mt-4 max-w-3xl">
          <ul className="list-disc space-y-3 pl-5">
            {guidance.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted-foreground">
            Source checked {guidance.checked}. Confirm current conditions before departure.
          </p>
          <a
            href={guidance.source}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block underline"
          >
            Tourism authority guidance →
          </a>
          <Link
            to="/tailor-made"
            search={{ destinations: destination }}
            className="mt-6 block font-semibold text-primary print:hidden"
          >
            Plan a journey to {guidance.destination.name} →
          </Link>
          <p className="mt-2 text-sm text-muted-foreground print:hidden">
            Choose your exact dates in the Safari Brief; selecting a month here does not reserve
            anything.
          </p>
        </div>
      )}
    </section>
  );
}
