import { ArrowRight, Search, Check, MessageCircle } from "lucide-react";
import { whatsapp } from "@/lib/pelican";
import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Section, meta } from "@/components/site";
import { bookingStages } from "@/lib/booking";
import { lookupBooking, type BookingLookup } from "@/lib/booking.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/booking")({
  head: () =>
    meta(
      "Check my booking",
      "Look up the status of your Pelican booking request with your booking reference.",
    ),
  component: BookingLookupPage,
});

function BookingLookupPage() {
  const checkBooking = useServerFn(lookupBooking);
  const [ref, setRef] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BookingLookup | null>(null);
  const field = "booking-input";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      setResult(await checkBooking({ data: { ref, contact } }));
    } catch {
      setResult({ found: false, error: "Booking look-up is unavailable. Please contact Pelican." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section className="booking-page booking-status-page">
      <div className="booking-intro">
        <div>
          <p className="booking-eyebrow">YOUR JOURNEY, AT A GLANCE</p>
          <h1>
            Check your
            <br />
            <span className="text-clay">booking.</span>
          </h1>
          <p>Your next adventure is taking shape. Find the latest update on your request here.</p>
        </div>
        <Link to="/book" search={{}} className="booking-text-link">
          Planning another adventure?
          <span>
            Request a booking <ArrowRight size={15} />
          </span>
        </Link>
      </div>
      <div className="booking-layout">
        <div>
          <form onSubmit={submit} aria-busy={busy} className="booking-card booking-form">
            <div className="booking-section-heading">
              <span>
                <Search size={18} />
              </span>
              <div>
                <h2>Find your request</h2>
                <p>Use the details from your request confirmation.</p>
              </div>
            </div>
            <fieldset disabled={busy} className="booking-field-grid">
              <label>
                Booking reference
                <input
                  className={`${field} uppercase`}
                  autoCapitalize="characters"
                  spellCheck={false}
                  required
                  maxLength={20}
                  placeholder="Your booking reference"
                  value={ref}
                  onChange={(e) => {
                    setRef(e.target.value);
                    setResult(null);
                  }}
                />
              </label>
              <label>
                Email or phone
                <input
                  className={field}
                  required
                  maxLength={255}
                  placeholder="The contact detail you booked with"
                  value={contact}
                  onChange={(e) => {
                    setContact(e.target.value);
                    setResult(null);
                  }}
                />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" size="lg" className="gap-3">
                  {busy ? "Checking…" : "Check status"}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </fieldset>
            {result && !result.found && (
              <p role="alert" className="booking-error">
                {result.error ??
                  "No booking matches that reference and contact detail. Please check both and try again."}
              </p>
            )}
          </form>
          {result?.found && (
            <section role="status" className="booking-card booking-result mt-6">
              <p className="booking-eyebrow">YOUR BOOKING REQUEST</p>
              <h2 className="mt-3 text-2xl font-semibold">{result.tripName}</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Requested {new Date(result.requestedAt).toLocaleDateString()}
              </p>
              {result.stage === "Closed" ? (
                <p className="mt-6 text-lg">This request is closed.</p>
              ) : (
                <ol className="booking-progress">
                  {bookingStages.map((stage, i) => {
                    const reached = i <= bookingStages.indexOf(result.stage as never);
                    return (
                      <li
                        key={stage}
                        className={reached ? "is-reached" : ""}
                        aria-current={stage === result.stage ? "step" : undefined}
                      >
                        <span>{reached ? <Check size={15} /> : i + 1}</span>
                        <strong>{stage}</strong>
                      </li>
                    );
                  })}
                </ol>
              )}
              <p className="mt-6 text-sm text-muted-foreground">
                {result.stage === "Confirmed"
                  ? "Pelican has confirmed your booking. Contact the team for any changes to your agreed travel arrangements."
                  : result.stage === "Closed"
                    ? "Contact Pelican if you would like to discuss another trip."
                    : "Your request is being reviewed. It becomes confirmed once Pelican accepts your booking."}
              </p>
            </section>
          )}
        </div>
        <aside className="booking-sidebar">
          <section className="booking-next booking-status-help">
            <span className="booking-success-icon">
              <MessageCircle size={23} />
            </span>
            <h2 className="mt-6">A little help?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Your reference is in the confirmation you received after sending your request. Use the
              same email address or phone number you provided.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              If you can’t find it, Pelican can help you pick up where you left off.
            </p>
            <a
              href={whatsapp()}
              target="_blank"
              rel="noreferrer"
              className="booking-text-link mt-6"
            >
              <span>
                Chat with Pelican <ArrowRight size={15} />
              </span>
            </a>
          </section>
        </aside>
      </div>
    </Section>
  );
}
