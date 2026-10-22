import { AppSelect } from "@/components/ui/app-select";
import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Section, meta } from "@/components/site";
import { bookableTrips, bookingInput, tripForCode } from "@/lib/booking";
import { requestBooking } from "@/lib/booking.functions";
import { img, safaris } from "@/lib/pelican";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/book")({
  validateSearch: z.object({ trip: z.string().optional() }),
  head: () => meta("Request to book", "Send Pelican a booking request for a safari or tour and receive your booking reference."),
  component: BookPage,
});

const steps = ["Choose trip", "Your details", "Review & send"] as const;

function BookPage() {
  const sendBooking = useServerFn(requestBooking);
  const { trip } = Route.useSearch();
  const [code, setCode] = useState(trip && tripForCode(trip) ? trip : bookableTrips[0]!.code);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pref, setPref] = useState<"Email" | "WhatsApp" | "Phone">("Email");
  const [dates, setDates] = useState("");
  const [travellers, setTravellers] = useState("2");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState("");
  const [error, setError] = useState("");
  const pending = useRef<{ fingerprint: string; id: string } | null>(null);
  const field = "mt-2 w-full border-b border-foreground/25 bg-transparent py-3 outline-none focus:border-primary";

  const selected = tripForCode(code)!;
  const safari = safaris.find((s) => s.slug === selected.slug);
  const photo = safari?.image ?? "car-safari-scene";

  function next() {
    setError("");
    if (step === 1) {
      if (!name.trim() || !(email.trim() || phone.trim()) || !dates.trim() || !(Number(travellers) >= 1)) {
        setError("Please enter your name, an email or phone number, your preferred dates and the number of travellers.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 2));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < 2) { next(); return; }
    if (busy || ref) return;
    setError("");
    const body = { trip_code: code, name: name.trim(), email: email.trim() || null, phone: phone.trim() || null,
      contact_preference: pref, dates: dates.trim(), travellers: Number(travellers), notes: notes.trim() };
    const fingerprint = JSON.stringify(body);
    if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, id: crypto.randomUUID() };
    const parsed = bookingInput.safeParse({ ...body, request_id: pending.current.id });
    if (!parsed.success) { setError("Please enter your name, an email or phone number, your preferred dates and the number of travellers."); setStep(1); return; }
    setBusy(true);
    try {
      const r = await sendBooking({ data: parsed.data });
      if (r.bookingRef) setRef(r.bookingRef); else setError(r.error ?? "Request not confirmed. Please retry.");
    } catch {
      setError("We could not confirm your request. Your details are still here; retry without creating a duplicate, or WhatsApp Pelican.");
    } finally { setBusy(false); }
  }

  const current = ref ? 3 : step;

  return (
    <Section className="pt-32">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Booking request</p>
      <h1 className="mt-3 font-display text-5xl">Request to book</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">A booking request is not a confirmed booking. Pelican will check availability and send you a written price and terms before anything is confirmed.</p>

      <ol className="mt-10 grid grid-cols-3 border-b border-border text-sm" aria-label="Booking steps">
        {steps.map((label, i) => (
          <li key={label} aria-current={i === current ? "step" : undefined}
            className={`-mb-px flex items-center gap-3 border-b-2 pb-4 ${i <= current ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${i < current ? "bg-primary text-primary-foreground" : i === current ? "border border-primary text-primary" : "border border-border"}`}>
              {i < current ? "✓" : `0${i + 1}`}
            </span>
            <span className="hidden font-semibold sm:inline">{label}</span>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {ref ? (
            <div role="status">
              <h2 className="text-3xl font-semibold">Request received</h2>
              <p className="mt-4 text-lg">Trip {selected.code} · Your reference <strong>{ref}</strong></p>
              <p className="mt-4 text-muted-foreground">Keep this reference. You can check your booking status any time with it and your email or phone number.</p>
              <Link to="/booking" className="mt-6 inline-block text-sm font-semibold text-primary">Check my booking →</Link>
            </div>
          ) : (
            <form onSubmit={submit} aria-busy={busy}>
              <fieldset disabled={busy}>
                {step === 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold">Choose your trip</h2>
                    <div className="mt-6 grid gap-3" role="radiogroup" aria-label="Trip">
                      {bookableTrips.map((t) => {
                        const s = safaris.find((x) => x.slug === t.slug);
                        const on = t.code === code;
                        return (
                          <button type="button" role="radio" aria-checked={on} key={t.code} onClick={() => setCode(t.code)}
                            className={`flex items-center gap-4 border p-3 text-left transition-colors ${on ? "border-primary" : "border-border hover:border-foreground/40"}`}>
                            <img src={img(s?.image ?? "car-safari-scene", 640)} alt="" className="h-16 w-24 shrink-0 object-cover" loading="lazy" />
                            <span className="min-w-0">
                              <span className="block font-semibold">{t.name}</span>
                              <span className="block text-sm text-muted-foreground">{s?.short ?? "A safari planned around you with Pelican."}</span>
                            </span>
                            <span className="ml-auto text-xs font-semibold tracking-wider text-clay">{t.code}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h2 className="text-2xl font-semibold">Your details</h2>
                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                      <label>Your name<input className={field} autoComplete="name" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} /></label>
                      <label>Preferred contact
                        <AppSelect className={field} value={pref} onChange={(e) => setPref(e.target.value as typeof pref)}>
                          <option>Email</option><option>WhatsApp</option><option>Phone</option>
                        </AppSelect>
                      </label>
                      <label>Email address<input className={field} type="email" autoComplete="email" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                      <label>Phone / WhatsApp<input className={field} type="tel" autoComplete="tel" maxLength={50} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
                      <label>Preferred dates<input className={field} required maxLength={200} placeholder="e.g. 10–15 June 2027, flexible" value={dates} onChange={(e) => setDates(e.target.value)} /></label>
                      <label>Number of travellers<input className={field} type="number" min={1} max={60} required value={travellers} onChange={(e) => setTravellers(e.target.value)} /></label>
                      <label className="sm:col-span-2">Notes (optional)<textarea className={field} rows={4} maxLength={4000} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="text-2xl font-semibold">Review & send</h2>
                    <dl className="mt-6 divide-y divide-border border-y border-border">
                      {[
                        ["Trip", `${selected.name} (${selected.code})`],
                        ["Name", name],
                        ["Contact", [email, phone].filter(Boolean).join(" · ")],
                        ["Preferred contact", pref],
                        ["Dates", dates],
                        ["Travellers", travellers],
                        ...(notes.trim() ? [["Notes", notes]] : []),
                      ].map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[140px_1fr] gap-4 py-3 text-sm">
                          <dt className="text-muted-foreground">{k}</dt><dd className="whitespace-pre-line">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                <div className="mt-8 flex items-center gap-4">
                  {step > 0 && <Button type="button" variant="outline" size="lg" onClick={() => { setError(""); setStep(step - 1); }}>Back</Button>}
                  <Button type="submit" size="lg">{step < 2 ? "Continue" : busy ? "Sending…" : "Send booking request"}</Button>
                </div>
              </fieldset>
              {error && <p role="alert" className="mt-4 text-sm text-primary">{error}</p>}
            </form>
          )}
        </div>

        <aside className="self-start border border-border lg:sticky lg:top-28" aria-label="Booking summary">
          <img src={img(photo, 640)} alt={safari?.name ?? "Safari"} className="aspect-[4/3] w-full object-cover" />
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Trip {selected.code}</p>
            <h3 className="mt-2 font-display text-2xl">{selected.name}</h3>
            {safari && <p className="mt-2 text-sm text-muted-foreground">{safari.short}</p>}
            <dl className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Dates</dt><dd className="text-right">{dates.trim() || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Travellers</dt><dd>{travellers || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Price</dt><dd className="text-right">Quoted in writing by Pelican</dd></div>
            </dl>
            <p className="mt-6 text-xs text-muted-foreground">No payment is taken now. Already sent a request? <Link to="/booking" className="font-semibold text-primary">Check my booking</Link></p>
          </div>
        </aside>
      </div>
    </Section>
  );
}
