import { ArrowRight, Check, MapPin, Mail, CalendarDays } from "lucide-react";
import { safaris, destinations, whatsapp } from "@/lib/pelican";
import { AppSelect } from "@/components/ui/app-select";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Section, Photo, meta } from "@/components/site";
import { bookableTrips, bookingInput, tripForCode } from "@/lib/booking";
import { requestBooking } from "@/lib/booking.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/book")({
  validateSearch: z.object({ trip: z.string().optional() }),
  head: () =>
    meta(
      "Request to book",
      "Send Pelican a booking request for a safari or tour and receive your booking reference.",
    ),
  component: BookPage,
});

function BookPage() {
  const sendBooking = useServerFn(requestBooking);
  const { trip } = Route.useSearch();
  const [code, setCode] = useState(trip && tripForCode(trip) ? trip : bookableTrips[0]!.code);
  const [step, setStep] = useState(0);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(0);
  useEffect(() => {
    if (step !== previousStep.current) {
      stepHeading.current?.focus();
      previousStep.current = step;
    }
  }, [step]);
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
  const field = "booking-input";

  function next() {
    setError("");
    if (
      step === 0 &&
      (!dates.trim() ||
        !Number.isInteger(Number(travellers)) ||
        Number(travellers) < 1 ||
        Number(travellers) > 60)
    ) {
      setError("Add your preferred dates and between 1 and 60 travellers.");
      return;
    }
    if (step === 1 && (!name.trim() || !(email.trim() || phone.trim()))) {
      setError("Please add your name and an email address or phone number.");
      return;
    }
    setStep((value) => Math.min(value + 1, 2));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || ref) return;
    if (step < 2) {
      next();
      return;
    }
    setError("");
    const body = {
      trip_code: code,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      contact_preference: pref,
      dates: dates.trim(),
      travellers: Number(travellers),
      notes: notes.trim(),
    };
    const fingerprint = JSON.stringify(body);
    if (pending.current?.fingerprint !== fingerprint)
      pending.current = { fingerprint, id: crypto.randomUUID() };
    const parsed = bookingInput.safeParse({ ...body, request_id: pending.current.id });
    if (!parsed.success) {
      setError(
        "Please enter your name, an email or phone number, your preferred dates and the number of travellers.",
      );
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      const r = await sendBooking({ data: parsed.data });
      if (r.bookingRef) setRef(r.bookingRef);
      else setError(r.error ?? "Request not confirmed. Please retry.");
    } catch {
      setError(
        "We could not confirm your request. Your details are still here; retry without creating a duplicate, or WhatsApp Pelican.",
      );
    } finally {
      setBusy(false);
    }
  }

  const selected = tripForCode(code)!;
  const safari = safaris.find((item) => item.slug === selected.slug);
  return (
    <Section className="booking-page">
      <div className="booking-intro">
        <div>
          <p className="booking-eyebrow">LET’S MAKE IT HAPPEN</p>
          <h1>
            Your next journey
            <br />
            <span className="text-clay">starts here.</span>
          </h1>
          <p>Choose your safari and share a few details. We’ll help you shape the rest.</p>
        </div>
        <Link to="/booking" className="booking-text-link">
          Already sent a request?{" "}
          <span>
            Check my booking <ArrowRight size={15} />
          </span>
        </Link>
      </div>
      <div className="booking-layout">
        {ref ? (
          <section role="status" className="booking-card booking-receipt">
            <span className="booking-success-icon">
              <Check size={24} />
            </span>
            <p className="booking-eyebrow mt-6">YOU’RE ONE STEP CLOSER</p>
            <h2>Request received.</h2>
            <p>
              Thank you, {name.trim()}. Pelican will check availability and contact you about your
              journey.
            </p>
            <div className="booking-reference">
              <span>Your booking reference</span>
              <strong>{ref}</strong>
              <small>
                Keep this reference to check your request using the same email or phone number.
              </small>
            </div>
            <p className="text-sm text-muted-foreground">
              Your request is not a confirmed reservation. Pelican will send a written price and
              terms before confirmation.
            </p>
            <Button asChild size="lg" className="mt-6 gap-3">
              <Link to="/booking">
                Check my booking
                <ArrowRight size={16} />
              </Link>
            </Button>
          </section>
        ) : (
          <form onSubmit={submit} aria-busy={busy} className="booking-card booking-form">
            <ol className="booking-stepper" aria-label="Booking steps">
              {["Choose trip", "Your details", "Review & send"].map((label, index) => (
                <li
                  key={label}
                  className={index <= step ? "is-current" : ""}
                  aria-current={step === index ? "step" : undefined}
                >
                  <span>{index < step ? <Check size={13} /> : `0${index + 1}`}</span>
                  <strong>{label}</strong>
                </li>
              ))}
            </ol>
            <fieldset disabled={busy} className="space-y-8">
              {step === 0 && (
                <section>
                  <div className="booking-section-heading">
                    <span>01</span>
                    <div>
                      <h2 ref={stepHeading} tabIndex={-1}>
                        Your safari
                      </h2>
                      <p>A starting point for your adventure.</p>
                    </div>
                  </div>
                  <div className="booking-field-grid">
                    <fieldset className="booking-trip-options sm:col-span-2">
                      <legend className="sr-only">Choose your trip</legend>
                      {bookableTrips.map((item) => {
                        const detail = safaris.find((s) => s.slug === item.slug);
                        return (
                          <label
                            key={item.code}
                            className={item.code === code ? "is-selected" : ""}
                          >
                            <input
                              type="radio"
                              name="trip"
                              value={item.code}
                              checked={code === item.code}
                              onChange={() => setCode(item.code)}
                            />
                            <Photo
                              name={detail?.image ?? "savanna-plains-sunset"}
                              alt=""
                              pan={false}
                              sizes="80px"
                              className="booking-option-photo"
                            />
                            <span>
                              <strong>{item.name}</strong>
                              <small>{detail?.short ?? "A safari shaped around you."}</small>
                            </span>
                          </label>
                        );
                      })}
                    </fieldset>
                    <label>
                      Preferred dates
                      <input
                        className={field}
                        required
                        maxLength={200}
                        placeholder="e.g. 10–15 June 2027, flexible"
                        value={dates}
                        onChange={(e) => setDates(e.target.value)}
                      />
                    </label>
                    <label>
                      Number of travellers
                      <input
                        className={field}
                        type="number"
                        min={1}
                        max={60}
                        required
                        value={travellers}
                        onChange={(e) => setTravellers(e.target.value)}
                      />
                    </label>
                  </div>
                </section>
              )}
              {step === 1 && (
                <>
                  <section>
                    <div className="booking-section-heading">
                      <span>02</span>
                      <div>
                        <h2 ref={stepHeading} tabIndex={-1}>
                          A little about you
                        </h2>
                        <p>Where should we send the next steps?</p>
                      </div>
                    </div>
                    <div className="booking-field-grid">
                      <label>
                        Your name
                        <input
                          className={field}
                          autoComplete="name"
                          required
                          maxLength={200}
                          placeholder="Full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </label>
                      <label>
                        Preferred contact
                        <AppSelect
                          className={field}
                          value={pref}
                          onChange={(e) => setPref(e.target.value as typeof pref)}
                        >
                          <option>Email</option>
                          <option>WhatsApp</option>
                          <option>Phone</option>
                        </AppSelect>
                      </label>
                      <label>
                        Email address
                        <input
                          className={field}
                          type="email"
                          autoComplete="email"
                          maxLength={255}
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </label>
                      <label>
                        Phone / WhatsApp
                        <input
                          className={field}
                          type="tel"
                          autoComplete="tel"
                          maxLength={50}
                          placeholder="Include country code"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </label>
                    </div>
                    <p className="booking-field-note">
                      Add an email address or phone number so we can get back to you.
                    </p>
                  </section>
                  <section className="booking-form-section">
                    <div className="booking-section-heading">
                      <span>+</span>
                      <div>
                        <h2>Make it yours</h2>
                        <p>The small details make a difference.</p>
                      </div>
                    </div>
                    <label>
                      Notes (optional)
                      <textarea
                        className={field}
                        rows={4}
                        maxLength={4000}
                        placeholder="Interests, special occasions, accessibility needs or anything you’d like us to know…"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </label>
                  </section>
                </>
              )}
              {step === 2 && (
                <section>
                  <div className="booking-section-heading">
                    <span>03</span>
                    <div>
                      <h2 ref={stepHeading} tabIndex={-1}>
                        Review your request
                      </h2>
                      <p>A final look before you send.</p>
                    </div>
                  </div>
                  <dl className="booking-review">
                    {[
                      ["Safari", selected.name],
                      ["Preferred dates", dates],
                      ["Travellers", travellers],
                      ["Your name", name],
                      ["Contact", [email, phone].filter(Boolean).join(" · ")],
                      ["Preferred contact", pref],
                      ...(notes.trim() ? [["Notes", notes]] : []),
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
              <div className="booking-submit">
                <p>
                  Availability, price and booking terms will be confirmed with you before you
                  commit.
                </p>
                <div className="flex gap-3">
                  {step > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setError("");
                        setStep(step - 1);
                      }}
                    >
                      Back
                    </Button>
                  )}
                  <Button type="submit" size="lg" className="gap-3">
                    {step < 2 ? "Continue" : busy ? "Sending…" : "Send booking request"}
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </fieldset>
            {error && (
              <p role="alert" className="booking-error">
                {error}
              </p>
            )}
          </form>
        )}
        <aside className="booking-sidebar" aria-label="Your selected safari">
          <div className="booking-trip-card">
            <Photo
              name={safari?.image ?? "savanna-plains-sunset"}
              alt={safari?.name ?? "Namibian landscape"}
              className="booking-trip-photo"
              sizes="(min-width: 1024px) 380px, 100vw"
              loading="eager"
              pan={false}
            />
            <div className="booking-trip-copy">
              <p className="booking-eyebrow">YOUR JOURNEY</p>
              <h2>{selected.name}</h2>
              <p>
                {safari?.short ?? "A journey shaped around your interests, dates and travel style."}
              </p>
              {safari && (
                <p className="booking-destinations">
                  <MapPin size={15} />
                  <span>
                    {safari.destinations
                      .map((slug) => destinations.find((d) => d.slug === slug)?.name)
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </p>
              )}
              <dl className="booking-live-summary">
                <div>
                  <dt>Preferred dates</dt>
                  <dd>{dates.trim() || "To be arranged"}</dd>
                </div>
                <div>
                  <dt>Travellers</dt>
                  <dd>{travellers || "To be arranged"}</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>Quoted in writing by Pelican</dd>
                </div>
              </dl>
            </div>
          </div>
          <section className="booking-next">
            <h2>What happens next?</h2>
            <ol>
              <li>
                <Mail size={17} />
                <div>
                  <strong>We receive your request</strong>
                  <p>Keep your personal booking reference.</p>
                </div>
              </li>
              <li>
                <CalendarDays size={17} />
                <div>
                  <strong>We work through the details</strong>
                  <p>Pelican checks availability and discusses your plans.</p>
                </div>
              </li>
              <li>
                <Check size={17} />
                <div>
                  <strong>You choose when to confirm</strong>
                  <p>Review your written price and terms first.</p>
                </div>
              </li>
            </ol>
            <a href={whatsapp()} target="_blank" rel="noreferrer" className="booking-text-link">
              Prefer a conversation?{" "}
              <span>
                Chat with Pelican <ArrowRight size={14} />
              </span>
            </a>
          </section>
        </aside>
      </div>
    </Section>
  );
}
