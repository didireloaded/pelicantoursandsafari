import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Section, meta } from "@/components/site";
import { bookableTrips, bookingInput, tripForCode } from "@/lib/booking";
import { requestBooking } from "@/lib/booking.functions";

export const Route = createFileRoute("/book")({
  validateSearch: z.object({ trip: z.string().optional() }),
  head: () => meta("Request to book", "Send Pelican a booking request for a safari or tour and receive your booking reference."),
  component: BookPage,
});

function BookPage() {
  const { trip } = Route.useSearch();
  const [code, setCode] = useState(trip && tripForCode(trip) ? trip : bookableTrips[0]!.code);
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

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || ref) return;
    setError("");
    const body = { trip_code: code, name: name.trim(), email: email.trim() || null, phone: phone.trim() || null,
      contact_preference: pref, dates: dates.trim(), travellers: Number(travellers), notes: notes.trim() };
    const fingerprint = JSON.stringify(body);
    if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, id: crypto.randomUUID() };
    const parsed = bookingInput.safeParse({ ...body, request_id: pending.current.id });
    if (!parsed.success) { setError("Please enter your name, an email or phone number, your preferred dates and the number of travellers."); return; }
    setBusy(true);
    try {
      const r = await requestBooking({ data: parsed.data });
      if (r.bookingRef) setRef(r.bookingRef); else setError(r.error ?? "Request not confirmed. Please retry.");
    } catch {
      setError("We could not confirm your request. Your details are still here; retry without creating a duplicate, or WhatsApp Pelican.");
    } finally { setBusy(false); }
  }

  const selected = tripForCode(code)!;
  return (
    <Section className="pt-32">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Booking request</p>
      <h1 className="mt-3 font-display text-5xl">Request to book</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">A booking request is not a confirmed booking. Pelican will check availability and send you a written price and terms before anything is confirmed.</p>
      {ref ? (
        <div role="status" className="mt-10 max-w-2xl border-t border-border pt-8">
          <h2 className="text-3xl font-semibold">Request received</h2>
          <p className="mt-4 text-lg">Trip {selected.code} · Your reference <strong>{ref}</strong></p>
          <p className="mt-4 text-muted-foreground">Keep this reference. You can check your booking status any time with it and your email or phone number.</p>
          <Link to="/booking" className="mt-6 inline-block text-sm font-semibold text-primary">Check my booking →</Link>
        </div>
      ) : (
        <form onSubmit={submit} aria-busy={busy} className="mt-10 max-w-3xl">
          <fieldset disabled={busy} className="grid gap-6 sm:grid-cols-2">
            <label className="sm:col-span-2">Trip
              <select className={field} value={code} onChange={(e) => setCode(e.target.value)}>
                {bookableTrips.map((t) => <option key={t.code} value={t.code}>{t.name} ({t.code})</option>)}
              </select>
            </label>
            <label>Your name<input className={field} autoComplete="name" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>Preferred contact
              <select className={field} value={pref} onChange={(e) => setPref(e.target.value as typeof pref)}>
                <option>Email</option><option>WhatsApp</option><option>Phone</option>
              </select>
            </label>
            <label>Email address<input className={field} type="email" autoComplete="email" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label>Phone / WhatsApp<input className={field} type="tel" autoComplete="tel" maxLength={50} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <label>Preferred dates<input className={field} required maxLength={200} placeholder="e.g. 10–15 June 2027, flexible" value={dates} onChange={(e) => setDates(e.target.value)} /></label>
            <label>Number of travellers<input className={field} type="number" min={1} max={60} required value={travellers} onChange={(e) => setTravellers(e.target.value)} /></label>
            <label className="sm:col-span-2">Notes (optional)<textarea className={field} rows={4} maxLength={4000} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
            <div className="sm:col-span-2"><Button type="submit" size="lg">{busy ? "Sending…" : "Send booking request"}</Button></div>
          </fieldset>
          {error && <p role="alert" className="mt-4 text-sm text-primary">{error}</p>}
        </form>
      )}
    </Section>
  );
}
