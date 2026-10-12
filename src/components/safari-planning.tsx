import { Link } from "@tanstack/react-router";
import { company, whatsapp } from "@/lib/pelican";
import { approvedSource, useApprovedTravelDetails } from "@/lib/approved-travel-details";

export function SafariPlanningSteps() {
  return <div>
    <h2 className="text-3xl font-semibold">How planning works</h2>
    <ol className="mt-6 grid gap-6 md:grid-cols-3">
      {[
        ["Share your ideas", "Choose destinations, dates, interests and a budget. Your Safari Brief is an enquiry, not a reservation."],
        ["Shape your proposal", "Discuss the route with Pelican and review the proposed itinerary, accommodation, price, inclusions and exclusions."],
        ["Confirm the details", "Agree the written booking, payment and cancellation terms before confirming. Availability remains subject to confirmation."],
      ].map(([title, body], index) => <li key={title} className="border-t border-border py-5">
        <span className="text-sm text-clay">0{index + 1}</span>
        <h3 className="mt-3 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </li>)}
    </ol>
    <Link to="/tailor-made" search={{}} className="mt-5 inline-block text-sm font-semibold text-primary">Start your Safari Brief →</Link>
  </div>;
}

export function PelicanContactInfo() {
  return <div className="space-y-4 text-sm leading-relaxed">
    <p>{company.lead}</p>
    <p className="text-muted-foreground">{company.vehicles}</p>
    <p>{company.address.join(", ")} · {company.hours}</p>
    <p className="text-muted-foreground">Our target is to reply within two business days, Monday–Friday. Ask which guide and vehicle will operate your trip before confirming.</p>
    <a href={whatsapp("Hello Kamwi, could you help me plan my safari?")} target="_blank" rel="noreferrer" className="inline-block font-semibold text-primary">Talk to Kamwi on WhatsApp →</a>
  </div>;
}

export function ApprovedTravelTrust() {
  const { rows } = useApprovedTravelDetails();
  const entries = rows.filter(row => row.approved && ["review", "credential"].includes(row.category) && approvedSource(row.source_url));
  if (!entries.length) return null;
  return <section className="mt-8 space-y-5" aria-label="Guest reviews and business credentials">
    {entries.map(row => <article key={row.id} className="border-t border-border pt-5">
      <p className="text-xs uppercase tracking-widest text-clay">{row.category === "review" ? "Guest review" : "Business credential"}</p>
      <h3 className="mt-2 text-lg font-semibold">{row.title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{row.body}</p>
      <a href={approvedSource(row.source_url)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-primary underline">View source →</a>
    </article>)}
  </section>;
}
