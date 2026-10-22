import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Section, meta } from "@/components/site";
import { bookingStages } from "@/lib/booking";
import { lookupBooking, type BookingLookup } from "@/lib/booking.functions";

export const Route = createFileRoute("/booking")({
  head: () => meta("Check my booking", "Look up the status of your Pelican booking request with your booking reference."),
  component: BookingLookupPage,
});

function BookingLookupPage() {
  const [ref, setRef] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BookingLookup | null>(null);
  const field = "mt-2 w-full border-b border-foreground/25 bg-transparent py-3 outline-none focus:border-primary";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try { setResult(await lookupBooking({ data: { ref, contact } })); }
    catch { setResult({ found: false, error: "Booking look-up is unavailable. Please contact Pelican." }); }
    finally { setBusy(false); }
  }

  return (
    <Section className="pt-32">
      <h1 className="font-display text-5xl">Check my booking</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">Enter the reference you received (for example ENP1-7K3Q) and the email or phone number you used.</p>
      <form onSubmit={submit} className="mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
        <label>Booking reference<input className={field} required maxLength={20} value={ref} onChange={(e) => setRef(e.target.value)} /></label>
        <label>Email or phone<input className={field} required maxLength={255} value={contact} onChange={(e) => setContact(e.target.value)} /></label>
        <div className="sm:col-span-2"><Button type="submit" size="lg" disabled={busy}>{busy ? "Checking…" : "Check status"}</Button></div>
      </form>
      {result && (result.found ? (
        <div role="status" className="mt-10 max-w-3xl border-t border-border pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Trip {result.tripCode}</p>
          <h2 className="mt-2 text-3xl font-semibold">{result.tripName}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Requested {new Date(result.requestedAt).toLocaleDateString()}</p>
          {result.stage === "Closed" ? <p className="mt-6 text-lg">Closed</p> : (
            <ol className="mt-6 flex flex-wrap gap-6">
              {bookingStages.map((s, i) => (
                <li key={s} className={i <= bookingStages.indexOf(result.stage as never) ? "font-semibold text-primary" : "text-muted-foreground"}>{i + 1}. {s}</li>
              ))}
            </ol>
          )}
          <p className="mt-6 text-sm text-muted-foreground">Only Pelican's written confirmation confirms your booking.</p>
        </div>
      ) : (
        <p role="alert" className="mt-8 text-sm text-primary">{result.error ?? "No booking matches that reference and contact detail."}</p>
      ))}
      <Link to="/book" search={{}} className="mt-10 block text-sm font-semibold text-primary">Request a new booking →</Link>
    </Section>
  );
}
