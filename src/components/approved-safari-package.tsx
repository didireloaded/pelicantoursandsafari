import { useState } from "react";
import {
  activeConversions,
  displayPackageAmount,
  formatNad,
  startingRate,
  todayUtc,
  type ApprovedSafariPackage,
  type SafariPackage,
} from "@/lib/safari-package";

export function SafariPackageSummary({ details }: { details?: SafariPackage }) {
  if (!details) return null;
  const rate = startingRate(details);
  return (
    <div className="mt-4 space-y-2 text-sm">
      {details.durationDays && (
        <p>
          {details.durationDays} {details.durationDays === 1 ? "day" : "days"}
        </p>
      )}
      {!!details.inclusions.length && <p>Includes: {details.inclusions.slice(0, 3).join(" · ")}</p>}
      {rate && (
        <p>
          From {formatNad(rate.amountNad)} per person sharing · {rate.label}
          <br />
          Travel {rate.startsOn} – {rate.endsOn}. Final quote and availability to be confirmed.
        </p>
      )}
    </div>
  );
}

export function SafariPackageDetails({ details, sourceUrl, updatedAt }: ApprovedSafariPackage) {
  const [currency, setCurrency] = useState("NAD");
  const conversions = activeConversions(details);
  const selected = conversions.find((rate) => rate.currency === currency);
  const actualCurrency = selected ? currency : "NAD";
  const rates = details.rates.filter((rate) => rate.endsOn >= todayUtc());
  return (
    <div className="space-y-12">
      {!!details.days.length && (
        <section id="itinerary" className="scroll-mt-40">
          <h2 className="text-3xl md:text-4xl">Day-by-day itinerary</h2>
          <ol className="mt-6 space-y-6">
            {details.days.map((day, index) => (
              <li key={index} className="border-t border-border pt-6">
                <h3 className="text-xl">Day {index + 1}</h3>
                <p className="mt-3 max-w-3xl leading-relaxed">{day.activities}</p>
                {day.overnight && (
                  <p className="mt-3 text-muted-foreground">Overnight: {day.overnight}</p>
                )}
                {day.transfer && (
                  <p className="mt-2 text-muted-foreground">Travel: {day.transfer}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
      {(details.inclusions.length > 0 || details.exclusions.length > 0) && (
        <section id="inclusions" className="scroll-mt-40 grid gap-8 md:grid-cols-2">
          {[
            { title: "Included", items: details.inclusions },
            { title: "Excluded", items: details.exclusions },
          ]
            .filter((group) => group.items.length)
            .map((group) => (
              <div key={group.title}>
                <h2 className="text-3xl">{group.title}</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5">
                  {group.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      )}
      {!!rates.length && (
        <section id="pricing" className="scroll-mt-40">
          <h2 className="text-3xl md:text-4xl">Seasonal pricing</h2>
          {!!conversions.length && (
            <label className="mt-5 block">
              Display currency{" "}
              <select
                className="ml-3 border bg-transparent p-2"
                value={actualCurrency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                <option>NAD</option>
                {conversions.map((rate) => (
                  <option key={rate.currency}>{rate.currency}</option>
                ))}
              </select>
            </label>
          )}
          {selected && (
            <p className="mt-3 text-sm text-muted-foreground">
              Indicative conversion only; quotes remain in NAD. Rate checked {selected.checkedOn}.{" "}
              <a
                href={selected.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Exchange-rate source
              </a>
            </p>
          )}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {rates.map((rate, index) => (
              <div key={index} className="border border-border p-5">
                <h3 className="text-xl">{rate.label}</h3>
                <p className="mt-3">
                  {rate.startsOn} – {rate.endsOn}
                </p>
                <p className="mt-3 text-2xl">
                  {displayPackageAmount(rate.amountNad, actualCurrency, details)}
                </p>
                <p className="mt-2 text-sm">
                  Per person sharing · {formatNad(rate.amountNad)} base price
                </p>
                {rate.roomNotes && <p className="mt-3 text-muted-foreground">{rate.roomNotes}</p>}
              </div>
            ))}
          </div>
          <p className="mt-5 text-muted-foreground">
            Rates apply to the travel dates and room conditions shown. Availability, single
            supplements, optional activities and the final total require confirmation in your
            written quote. An enquiry is not a reservation.
          </p>
        </section>
      )}
      <p className="text-sm text-muted-foreground">
        Approved information updated {updatedAt.slice(0, 10)}.{" "}
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
          Source
        </a>
      </p>
    </div>
  );
}
