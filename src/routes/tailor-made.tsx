import { AppSelect } from "@/components/ui/app-select";
import { usePublishedContent } from "@/lib/site-content-api";
import type { PackageContent } from "@/lib/site-content";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MessageCircle, Mail, ChevronUp, ChevronDown, X, Send } from "lucide-react";
import { submitTripEnquiry } from "@/lib/enquiry-submit.functions";
import { PageHero, Section, meta } from "@/components/site";
import { SafariPlanningSteps, PelicanContactInfo, ApprovedTravelTrust } from "@/components/safari-planning";
import { Button } from "@/components/ui/button";
import { company, destinations, getSafari, planningInterests, stays, whatsapp } from "@/lib/pelican";
import { parseShortlist } from "@/lib/shortlist";
import { planningSearch } from "@/lib/safari-discovery";
import { parseJourney, readJourney, journeySummary } from "@/lib/journey";
import { validateBriefPlanning } from "@/lib/brief-planning";

export const Route = createFileRoute("/tailor-made")({
  validateSearch: planningSearch,
  head: () => meta("Your Safari Brief", "Shape your Pelican safari with destinations, flexible dates, travel interests and personal preferences.", "car-safari-scene"),
  component: TailorMade,
});

function TailorMade() {
  const search = Route.useSearch();
  const packageQuery = usePublishedContent("package", !!search.package);
  const selectedPackage = packageQuery.data?.find(row => row.id === search.package)?.data as PackageContent | undefined;
  const shortlisted = parseShortlist(search.shortlist);
  const preferences = search.preferences ? JSON.parse(search.preferences) : {};
  const safari = search.safari ? getSafari(search.safari) : undefined;
  const [step, setStep] = useState(0);
  const [places, setPlaces] = useState<string[]>(() => search.destinations ? search.destinations.split(",").filter((slug) => destinations.some((d) => d.slug === slug)) : safari?.destinations ?? []);
  const [journey, setJourney] = useState(() => parseJourney(search.journey));
  useEffect(() => {
    if (!search.journey && !search.safari && !search.destinations) {
      const saved = readJourney();
      setJourney(saved);
      setPlaces([...new Set(saved.map((stop) => stop.destination))]);
    }
  }, [search.journey, search.safari, search.destinations]);
  const [countries, setCountries] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>((preferences.interests ?? []).filter((interest: string) => planningInterests.includes(interest)));
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [flexible, setFlexible] = useState(false);
  const [adults, setAdults] = useState("2");
  const [ages, setAges] = useState<string[]>([]);
  const [days, setDays] = useState(preferences.days ?? "");
  const [style, setStyle] = useState(preferences.style ?? "Open to suggestions");
  const [budget, setBudget] = useState(preferences.budget ?? "");
  const [experience, setExperience] = useState("Prefer to discuss");
  const [comfort, setComfort] = useState("Comfortable");
  const [pace, setPace] = useState("Balanced");
  const [occasion, setOccasion] = useState("");
  const [requests, setRequests] = useState("");
  const [mobility, setMobility] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [residence, setResidence] = useState("");
  const [contact, setContact] = useState("WhatsApp");
  const [prepared, setPrepared] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const [planningError, setPlanningError] = useState("");
  const [focusStep, setFocusStep] = useState(0);
  useEffect(() => { if (focusStep) heading.current?.focus(); }, [step, focusStep]);
  const planningIssue = (throughStep = 2) => validateBriefPlanning({ start, end, adults, ages, days, budget }, throughStep);
  const goToStep = (target: number) => {
    const issue = target > step ? planningIssue(target - 1) : null;
    setPrepared(false);
    setPlanningError(issue?.message ?? "");
    setStep(issue?.step ?? target);
    setFocusStep((value) => value + 1);
  };
  const checkPlanning = () => {
    const issue = planningIssue();
    if (!issue) { setPlanningError(""); return true; }
    setPlanningError(issue.message);
    setStep(issue.step);
    setFocusStep((value) => value + 1);
    return false;
  };
  const steps = ["Your journey", "Dates & travellers", "Travel preferences", "Review your brief"];
  const field = "mt-2 w-full border-b border-foreground/25 bg-transparent py-3 outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary";
  const toggle = (values: string[], value: string) => values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
  const move = (index: number, change: number) => setPlaces((prev) => { const next = [...prev]; const target = index + change; const value = next[index]; const other = next[target]; if (value && other) { next[index] = other; next[target] = value; } return next; });
  const summary = [
    search.package ? `Package requested: ${selectedPackage?.title ?? "See reference"} (reference ${search.package})` : "",
    shortlisted.length ? `Shortlisted options: ${shortlisted.map(x => x.kind === "safari" ? getSafari(x.slug)?.name : stays.find(stay => stay.slug === x.slug)?.name).join(", ")}` : "",
    preferences.interests?.length ? `Quiz interests: ${preferences.interests.join(", ")}` : "",
    safari ? `Safari inspiration: ${safari.name}` : "Tailor-made safari",
    ...journeySummary(journey.filter((s) => places.includes(s.destination)).sort((a, b) => places.indexOf(a.destination) - places.indexOf(b.destination))).split("\n").filter(Boolean).map((line) => `Accommodation / nights preference: ${line}`),
    `Journey preferences: ${places.map((slug) => destinations.find((d) => d.slug === slug)?.name).join(" → ") || "Please recommend"}`,
    `Countries: ${countries.join(", ") || "Based on destinations"}`,
    `Interests: ${interests.join(", ") || "Open to suggestions"}`,
    `Dates: ${flexible ? "Flexible" : "Preferred"}${start ? ` from ${start}` : " — to discuss"}${end ? ` to ${end}` : ""}`,
    `Travellers: ${adults} adults, ${ages.length} children${ages.length ? ` (ages: ${ages.map((a) => a || "to confirm").join(", ")})` : ""}`,
    `Trip length: ${days ? `${days} days` : "To discuss"}`,
    `Budget preference: ${budget ? `NAD ${budget} per person (subject to quote)` : "To discuss"}`,
    `Safari experience: ${experience}`,
    `Style: ${style}; comfort: ${comfort}; pace: ${pace}`,
    occasion ? `Occasion: ${occasion}` : "", mobility ? `Mobility/accessibility: ${mobility}` : "", requests ? `Special requests: ${requests}` : "",
    name ? `Name: ${name}` : "", email ? `Email: ${email}` : "", phone ? `Phone: ${phone}` : "", residence ? `Country of residence: ${residence}` : "", `Preferred contact: ${contact}`,
  ].filter(Boolean).join("\n");
  const message = `Hello Pelican, here is my Safari Brief.\n\n${summary}`;
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const pendingRequest = useRef<{ fingerprint: string; id: string } | null>(null);
  const submitLock = useRef(false);
  const submit = async () => {
    if (submitLock.current || sent) return;
    setError("");
    if (!checkPlanning()) return;
    if (!name.trim() || (!email.trim() && !phone.trim())) { setError("Please add your name and an email or phone number."); return; }
    if (name.length > 200 || email.length > 255 || phone.length > 50 || residence.length > 120 || summary.length > 8000 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) { setError("Please check your email and shorten any unusually long details before sending."); return; }
    const body = { name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, residence: residence.trim() || null, contact_preference: contact, safari_slug: safari?.slug ?? null, brief: summary };
    const fingerprint = JSON.stringify(body);
    if (!pendingRequest.current || pendingRequest.current.fingerprint !== fingerprint) pendingRequest.current = { fingerprint, id: crypto.randomUUID() };
    submitLock.current = true;
    setSending(true);
    try {
      const data = await submitTripEnquiry({ data: { ...body, request_id: pendingRequest.current.id }, signal: AbortSignal.timeout(60000) });
      if (!data.reference) { setError(data.error ?? "Receipt unavailable. Retry the same brief."); return; }
      setReference(String(data.reference)); setSent(true);
    } catch { setError("We could not confirm receipt. Retry the same brief to check without creating a duplicate. If you contact Pelican by WhatsApp or email instead, mention this attempted submission."); }
    finally { submitLock.current = false; setSending(false); }
  };
  return <>
    <PageHero eyebrow="Tailor-made" title="Your safari." accent="Your way." image="car-safari-scene">{company.specialty}</PageHero>
    <Section className="border-t border-border/60 pt-8 md:pt-10">
      <ol className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Safari Brief progress">{steps.map((title, i) => <li key={title}><Button variant="ghost" className={`h-auto w-full justify-start whitespace-normal border-b py-3 text-left ${step === i ? "border-primary text-primary" : "border-border text-muted-foreground"}`} onClick={() => goToStep(i)} aria-current={step === i ? "step" : undefined}>{i + 1}. {title}</Button></li>)}</ol>
      <div className="grid gap-12 lg:grid-cols-12"><div className="lg:col-span-8">
        <p className="mb-3 text-sm text-muted-foreground" role="status">Step {step + 1} of {steps.length}</p>
        <h2 ref={heading} tabIndex={-1} className="mb-8 text-3xl font-semibold">{steps[step]}</h2>
        {planningError && <p className="mb-6 text-sm text-primary" role="alert">{planningError}</p>}
        {step === 0 && <div className="space-y-10">
          {safari && <p className="text-primary">Inspired by {safari.name}</p>}
          <fieldset><legend className="mb-4 font-medium">Countries</legend><div className="flex flex-wrap gap-x-8 gap-y-4">{["Namibia", "Botswana", "Zimbabwe"].map((c) => <label key={c} className="flex items-center gap-2"><input type="checkbox" className="accent-primary" checked={countries.includes(c)} onChange={() => setCountries(toggle(countries, c))} />{c}</label>)}</div></fieldset>
          <fieldset><legend className="mb-4 font-medium">Places you would love to visit</legend><div className="grid gap-4 sm:grid-cols-2">{destinations.filter((d) => !countries.length || countries.includes(d.country)).map((d) => <label key={d.slug} className="flex items-center gap-3"><input type="checkbox" className="accent-primary" checked={places.includes(d.slug)} onChange={() => setPlaces(toggle(places, d.slug))} />{d.name}</label>)}</div></fieldset>
          <fieldset><legend className="mb-4 font-medium">What draws you here?</legend><div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{planningInterests.map((x) => <label key={x} className="flex items-center gap-2"><input type="checkbox" className="accent-primary" checked={interests.includes(x)} onChange={() => setInterests(toggle(interests, x))} />{x}</label>)}</div></fieldset>
        </div>}
        {step === 1 && <div className="grid gap-8 sm:grid-cols-2">
          <label className="flex items-center gap-3 sm:col-span-2"><input type="checkbox" className="accent-primary" checked={flexible} onChange={(e) => setFlexible(e.target.checked)} />My dates are flexible</label>
          <label>Preferred arrival<input type="date" className={field} value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label>Preferred departure<input type="date" className={field} min={start || undefined} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          <label>Adults<input type="number" min={1} max={100} className={field} value={adults} onChange={(e) => setAdults(e.target.value)} /></label>
          <label>Children<AppSelect className={field} value={ages.length} onChange={(e) => setAges(Array.from({ length: Number(e.target.value) }, (_, i) => ages[i] ?? ""))}>{Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i}</option>)}</AppSelect></label>
          {ages.map((age, i) => <label key={i}>Child {i + 1} age<input type="number" min={0} max={17} className={field} value={age} onChange={(e) => setAges((prev) => prev.map((a, index) => index === i ? e.target.value : a))} /></label>)}
          <label>Trip length in days<input type="number" min={1} max={365} className={field} placeholder="To discuss" value={days} onChange={(e) => setDays(e.target.value)} /></label>
        </div>}
        {step === 2 && <div className="grid gap-8 sm:grid-cols-2">
          <label>Budget per person (NAD)<input type="number" min={1} max={10000000} step={1} className={field} placeholder="To discuss" value={budget} onChange={(e) => setBudget(e.target.value)} /><span className="mt-2 block text-xs text-muted-foreground">Your planning preference, not a price or quote. Leave blank to discuss.</span></label>
          <label>Safari experience<AppSelect className={field} value={experience} onChange={(e) => setExperience(e.target.value)}>{["First safari", "Been on safari before", "Prefer to discuss"].map((x) => <option key={x}>{x}</option>)}</AppSelect></label>
          <label>Travel style<AppSelect className={field} value={style} onChange={(e) => setStyle(e.target.value)}>{["Open to suggestions", "Private guided", "Small group"].map((x) => <option key={x}>{x}</option>)}</AppSelect></label>
          <label>Comfort preference<AppSelect className={field} value={comfort} onChange={(e) => setComfort(e.target.value)}>{["Practical", "Comfortable", "Premium"].map((x) => <option key={x}>{x}</option>)}</AppSelect></label>
          <label>Trip pace<AppSelect className={field} value={pace} onChange={(e) => setPace(e.target.value)}>{["Relaxed", "Balanced", "See as much as possible"].map((x) => <option key={x}>{x}</option>)}</AppSelect></label>
          <label>Special occasion<AppSelect className={field} value={occasion} onChange={(e) => setOccasion(e.target.value)}><option value="">None</option>{["Honeymoon / couples", "Anniversary", "Birthday", "Family reunion"].map((x) => <option key={x}>{x}</option>)}</AppSelect></label>
          <label className="sm:col-span-2">Accessibility or mobility needs<textarea className={field} rows={2} value={mobility} onChange={(e) => setMobility(e.target.value)} /></label>
          <label className="sm:col-span-2">Special requests<textarea className={field} rows={3} value={requests} onChange={(e) => setRequests(e.target.value)} /></label>
        </div>}
        {step === 3 && <div className="space-y-8"><dl className="divide-y divide-border border-y border-border">{summary.split("\n").map((line, i) => { const split = line.indexOf(":"); return <div key={i} className="grid gap-2 py-4 sm:grid-cols-[160px_1fr]"><dt className="text-sm text-muted-foreground">{split < 0 ? "Brief" : line.slice(0, split)}</dt><dd className="break-words">{split < 0 ? line : line.slice(split + 1)}</dd></div>; })}</dl>
          <div className="grid gap-6 sm:grid-cols-2"><label>Your name<input autoComplete="name" className={field} value={name} onChange={(e) => setName(e.target.value)} /></label><label>Email<input type="email" autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Phone / WhatsApp<input type="tel" autoComplete="tel" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} /></label><label>Country of residence<input autoComplete="country-name" className={field} value={residence} onChange={(e) => setResidence(e.target.value)} /></label><label>Preferred contact<AppSelect className={field} value={contact} onChange={(e) => setContact(e.target.value)}>{["WhatsApp", "Email", "Phone"].map((x) => <option key={x}>{x}</option>)}</AppSelect></label></div>
          <div className="flex flex-wrap gap-3"><Button size="lg" disabled={sending || sent} onClick={submit}><Send />{sent ? "Brief sent to Pelican" : sending ? "Sending…" : "Send brief to Pelican"}</Button><Button asChild variant="outline" size="lg"><a href={whatsapp(message)} target="_blank" rel="noreferrer" onClick={(event) => { if (!checkPlanning()) { event.preventDefault(); return; } setPrepared(true); }}><MessageCircle />Send via WhatsApp</a></Button><Button asChild variant="ghost" size="lg"><a href={`mailto:${company.email}?subject=${encodeURIComponent("My Safari Brief")}&body=${encodeURIComponent(message)}`} onClick={(event) => { if (!checkPlanning()) { event.preventDefault(); return; } setPrepared(true); }}><Mail />Prepare email</a></Button></div>
          <p className="text-sm text-muted-foreground" role="status">{error || (sent ? `Thank you — reference ${reference}. Our target is to reply within two business days (Monday–Friday). We will discuss your preferences and send a proposal; your booking is confirmed only after agreed terms. If you have not heard from us, call or WhatsApp Pelican with this reference. This is not a confirmed booking.` : prepared ? "Your brief is ready in your chosen app. Send it there to reach Pelican; this is not a confirmed booking." : "Nothing is sent until you choose an option. Add your name and an email or phone number to send directly.")}</p>
        </div>}
        <div className="mt-12 flex justify-between border-t border-border pt-6"><Button variant="ghost" disabled={step === 0} onClick={() => goToStep(step - 1)}><ArrowLeft />Back</Button>{step < 3 && <Button onClick={() => goToStep(step + 1)}>{step === 2 ? "Review brief" : "Continue"}<ArrowRight /></Button>}</div>
      </div><aside className="lg:col-span-4"><h2 className="text-xl font-semibold">Your journey</h2><ol className="mt-4 divide-y divide-border">{places.map((slug, i) => <li key={slug} className="flex items-center gap-2 py-4"><span className="text-sm text-clay">{String(i + 1).padStart(2, "0")}</span><span className="flex-1 text-sm">{destinations.find((d) => d.slug === slug)?.name}</span><Button title="Move earlier" aria-label={`Move ${slug} earlier`} variant="ghost" size="icon" disabled={i === 0} onClick={() => move(i, -1)}><ChevronUp /></Button><Button title="Move later" aria-label={`Move ${slug} later`} variant="ghost" size="icon" disabled={i === places.length - 1} onClick={() => move(i, 1)}><ChevronDown /></Button><Button title="Remove destination" aria-label={`Remove ${slug}`} variant="ghost" size="icon" onClick={() => setPlaces(places.filter((p) => p !== slug))}><X /></Button></li>)}</ol>{!places.length && <p className="mt-4 text-sm text-muted-foreground">Open to Pelican’s recommendations.</p>}<p className="mt-5 text-xs text-muted-foreground">Preferred stops, not a confirmed route. Pelican will advise on order and travel times.</p>{step === 3 ? <div className="mt-8 border-t border-border pt-6"><h3 className="mb-4 text-lg font-semibold">Plan with Pelican</h3><PelicanContactInfo /><ApprovedTravelTrust /></div> : <Button asChild variant="link" className="mt-8 px-0"><a href={whatsapp("Hello Pelican, could you help me plan my safari?")} target="_blank" rel="noreferrer"><MessageCircle />Talk to Kamwi instead</a></Button>}</aside></div>
    </Section>
    <Section className="border-t border-border/60"><SafariPlanningSteps /></Section>
  </>;
}
