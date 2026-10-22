import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { safaris } from "@/lib/pelican";
import { emptySafariPackage, type SafariPackage } from "@/lib/safari-package";

export function SafariPackageEditor({
  slug,
  value,
  onChange,
  catalogueSelection = true,
}: {
  catalogueSelection?: boolean;
  slug: string;
  value: SafariPackage | null;
  onChange: (slug: string, details: SafariPackage | null) => void;
}) {
  const field = "mt-2 w-full border-b bg-transparent py-3";
  const change = (next: SafariPackage) => onChange(slug, next);
  return (
    <fieldset className="space-y-6 border border-border p-5">
      <legend className="px-2 text-xl">Verified safari package (optional)</legend>
      {catalogueSelection && (
        <label className="block">
          Catalogue safari
          <AppSelect
            className={field}
            value={slug}
            onChange={(event) =>
              onChange(
                event.target.value,
                event.target.value ? (value ?? emptySafariPackage()) : null,
              )
            }
          >
            <option value="">General information only</option>
            {safaris.map((safari) => (
              <option key={safari.slug} value={safari.slug}>
                {safari.name}
              </option>
            ))}
          </AppSelect>
        </label>
      )}
      {value && (
        <>
          <p className="text-sm text-muted-foreground">
            Add only approved facts. Leave unverified items empty. Prices are NAD per person
            sharing; date ranges refer to travel dates.{" "}
            {catalogueSelection
              ? "One published package is allowed per safari—unpublish the old package before replacing it."
              : "Save a draft before publishing verified changes."}
          </p>
          <label className="block">
            Duration in days (optional)
            <input
              className={field}
              type="number"
              min="1"
              max="90"
              step="1"
              value={value.durationDays ?? ""}
              onChange={(event) =>
                change({
                  ...value,
                  durationDays: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </label>
          <div className="space-y-5">
            <h3 className="text-xl">Day-by-day itinerary</h3>
            {value.days.map((day, index) => (
              <fieldset key={index} className="space-y-3 border border-border p-4">
                <legend>Day {index + 1}</legend>
                {(
                  [
                    ["activities", "Activities"],
                    ["overnight", "Overnight location (optional)"],
                    ["transfer", "Travel / pickup expectations (optional)"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    {label}
                    <textarea
                      className={field}
                      required={key === "activities"}
                      maxLength={key === "activities" ? 1200 : key === "overnight" ? 300 : 600}
                      value={day[key]}
                      onChange={(event) =>
                        change({
                          ...value,
                          days: value.days.map((current, i) =>
                            i === index ? { ...current, [key]: event.target.value } : current,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    change({ ...value, days: value.days.filter((_, i) => i !== index) })
                  }
                >
                  Remove day {index + 1}
                </Button>
              </fieldset>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={value.days.length >= 90}
              onClick={() =>
                change({
                  ...value,
                  days: [...value.days, { activities: "", overnight: "", transfer: "" }],
                })
              }
            >
              Add day
            </Button>
            <p className="text-sm">If you add days, duration must equal the number of days.</p>
          </div>
          {(["inclusions", "exclusions"] as const).map((key) => (
            <label className="block" key={key}>
              {key === "inclusions" ? "Included" : "Excluded"} (one item per line)
              <textarea
                className={field}
                rows={4}
                maxLength={36000}
                value={value[key].join("\n")}
                onChange={(event) => change({ ...value, [key]: event.target.value.split("\n") })}
              />
            </label>
          ))}
          <div className="space-y-5">
            <h3 className="text-xl">Seasonal rates</h3>
            {value.rates.map((rate, index) => (
              <fieldset key={index} className="space-y-3 border border-border p-4">
                <legend>Rate {index + 1}</legend>
                <label className="block">
                  Season / rate name
                  <input
                    required
                    className={field}
                    maxLength={120}
                    value={rate.label}
                    onChange={(event) =>
                      change({
                        ...value,
                        rates: value.rates.map((current, i) =>
                          i === index ? { ...current, label: event.target.value } : current,
                        ),
                      })
                    }
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  {(["startsOn", "endsOn"] as const).map((key) => (
                    <label key={key} className="block">
                      {key === "startsOn" ? "Travel starts from" : "Travel starts until"}
                      <input
                        required
                        type="date"
                        className={field}
                        value={rate[key]}
                        onChange={(event) =>
                          change({
                            ...value,
                            rates: value.rates.map((current, i) =>
                              i === index ? { ...current, [key]: event.target.value } : current,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                <label className="block">
                  NAD per person sharing
                  <input
                    required
                    type="number"
                    min="0.01"
                    max="10000000"
                    step="0.01"
                    className={field}
                    value={rate.amountNad || ""}
                    onChange={(event) =>
                      change({
                        ...value,
                        rates: value.rates.map((current, i) =>
                          i === index
                            ? { ...current, amountNad: Number(event.target.value) }
                            : current,
                        ),
                      })
                    }
                  />
                </label>
                <label className="block">
                  Room category and rate conditions
                  <textarea
                    maxLength={600}
                    className={field}
                    value={rate.roomNotes}
                    onChange={(event) =>
                      change({
                        ...value,
                        rates: value.rates.map((current, i) =>
                          i === index ? { ...current, roomNotes: event.target.value } : current,
                        ),
                      })
                    }
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    change({ ...value, rates: value.rates.filter((_, i) => i !== index) })
                  }
                >
                  Remove rate {index + 1}
                </Button>
              </fieldset>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={value.rates.length >= 24}
              onClick={() =>
                change({
                  ...value,
                  rates: [
                    ...value.rates,
                    { label: "", startsOn: "", endsOn: "", amountNad: 0, roomNotes: "" },
                  ],
                })
              }
            >
              Add seasonal rate
            </Button>
          </div>
          <div className="space-y-5">
            <h3 className="text-xl">Indicative currency conversion (optional)</h3>
            <p className="text-sm">
              Enter a sourced conversion per 1 NAD. Public conversions expire seven days after the
              checked date. This does not change quote or payment currency.
            </p>
            {value.conversions.map((rate, index) => (
              <fieldset key={index} className="space-y-3 border border-border p-4">
                <legend>Conversion {index + 1}</legend>
                <label className="block">
                  Currency
                  <AppSelect
                    className={field}
                    value={rate.currency}
                    onChange={(event) =>
                      change({
                        ...value,
                        conversions: value.conversions.map((current, i) =>
                          i === index
                            ? { ...current, currency: event.target.value as "USD" | "EUR" }
                            : current,
                        ),
                      })
                    }
                  >
                    <option>USD</option>
                    <option>EUR</option>
                  </AppSelect>
                </label>
                <label className="block">
                  Foreign currency per 1 NAD
                  <input
                    required
                    type="number"
                    min="0.000001"
                    max="10"
                    step="any"
                    className={field}
                    value={rate.perNad || ""}
                    onChange={(event) =>
                      change({
                        ...value,
                        conversions: value.conversions.map((current, i) =>
                          i === index
                            ? { ...current, perNad: Number(event.target.value) }
                            : current,
                        ),
                      })
                    }
                  />
                </label>
                <label className="block">
                  Rate checked on
                  <input
                    required
                    type="date"
                    className={field}
                    value={rate.checkedOn}
                    onChange={(event) =>
                      change({
                        ...value,
                        conversions: value.conversions.map((current, i) =>
                          i === index ? { ...current, checkedOn: event.target.value } : current,
                        ),
                      })
                    }
                  />
                </label>
                <label className="block">
                  Exchange-rate source URL
                  <input
                    required
                    type="url"
                    maxLength={1999}
                    className={field}
                    value={rate.sourceUrl}
                    onChange={(event) =>
                      change({
                        ...value,
                        conversions: value.conversions.map((current, i) =>
                          i === index ? { ...current, sourceUrl: event.target.value } : current,
                        ),
                      })
                    }
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    change({
                      ...value,
                      conversions: value.conversions.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove conversion
                </Button>
              </fieldset>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={value.conversions.length >= 2}
              onClick={() =>
                change({
                  ...value,
                  conversions: [
                    ...value.conversions,
                    {
                      currency: value.conversions.some((rate) => rate.currency === "USD")
                        ? "EUR"
                        : "USD",
                      perNad: 0,
                      checkedOn: "",
                      sourceUrl: "",
                    },
                  ],
                })
              }
            >
              Add sourced conversion
            </Button>
          </div>
        </>
      )}
    </fieldset>
  );
}
