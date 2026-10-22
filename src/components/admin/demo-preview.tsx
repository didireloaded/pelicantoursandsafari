import { useMemo, useState } from "react";
import { CalendarDays, Mail, Users, Compass } from "lucide-react";
import { adminDemo } from "@/lib/admin-demo";
import { initials, tripEnd } from "@/lib/admin-workspace";
import { reservationEvents, type ReservationEvent } from "@/lib/reservation-calendar";
import { ReservationCalendar } from "./reservation-calendar";

type View = "overview" | "clients" | "reservations" | "enquiries";

export function DemoPreview() {
  const demo = useMemo(() => adminDemo(), []);
  const [view, setView] = useState<View>("overview");
  const [selected, setSelected] = useState("");
  const [reservation, setReservation] = useState<ReservationEvent | null>(null);
  const events = useMemo(() => reservationEvents(demo.trips, demo.clients, demo.leads), [demo]);
  const client = demo.clients.find((person) => person.id === selected);
  const lead = demo.leads.find((item) => item.id === selected);
  const setSection = (section: View) => { setView(section); setSelected(""); setReservation(null); };

  return <>
    <div className="admin-page-heading">
      <div>
        <p className="admin-eyebrow">EXPLORE YOUR WORKSPACE</p>
        <h1 className="mt-2">See Pelican in action.</h1>
        <p>A sample of how clients, journeys and enquiries appear when your team starts using the workspace.</p>
      </div>
    </div>
    <div className="admin-panel mb-6 border-primary/30 p-5" role="note">
      <strong className="text-sm">Demo preview · fictional examples</strong>
      <p className="mt-1 text-sm text-muted-foreground">These names and trips are examples. This page is read-only and does not change live bookings, enquiries or website content.</p>
    </div>
    <div className="admin-tabs mb-6" role="group" aria-label="Preview sections">
      {(["overview", "clients", "reservations", "enquiries"] as const).map((section) => <button key={section} type="button" className={`admin-pill ${view === section ? "is-selected" : ""}`} aria-pressed={view === section} onClick={() => setSection(section)}>{section[0]!.toUpperCase() + section.slice(1)}</button>)}
    </div>
    {view === "overview" && <>
      <div className="admin-stats">
        {[
          { label: "Active bookings", value: 0, Icon: Compass },
          { label: "Upcoming departures", value: demo.trips.length, Icon: CalendarDays },
          { label: "Open enquiries", value: demo.leads.length, Icon: Mail },
          { label: "Clients", value: demo.clients.length, Icon: Users },
        ].map(({ label, value, Icon }) => <div key={label} className="admin-panel admin-stat"><div className="admin-stat-label">{label}<Icon size={16} /></div><p className="admin-stat-value">{value}</p><p className="admin-stat-note">Example data</p></div>)}
      </div>
      <div className="admin-main-grid">
        <section className="admin-panel p-6"><h2 className="admin-panel-heading">Upcoming journeys</h2>{demo.trips.map((trip) => <div className="admin-row" key={trip.id}><span className="admin-avatar">{initials(demo.clients.find((person) => person.id === trip.client_id)?.name ?? "Guest")}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs font-medium">{trip.title}</strong><small className="block text-xs text-muted-foreground">{demo.clients.find((person) => person.id === trip.client_id)?.name} · {trip.starts_on} — {tripEnd(trip)}</small></span><span className="admin-status confirmed">Confirmed</span></div>)}</section>
        <section className="admin-panel p-6"><h2 className="admin-panel-heading">Recent enquiries</h2>{demo.leads.map((item) => <div className="admin-row" key={item.id}><span className="admin-avatar">{initials(item.name)}</span><span className="min-w-0 flex-1"><strong className="block text-xs font-medium">{item.name}</strong><small className="block text-xs text-muted-foreground">{item.residence} · {item.created_at.slice(0, 10)}</small></span><span className="admin-status">{item.status.replaceAll("_", " ")}</span></div>)}</section>
      </div>
    </>}
    {view === "clients" && <><div className="admin-client-grid">{demo.clients.map((person) => <button key={person.id} type="button" aria-pressed={selected === person.id} className="admin-panel admin-client-card" onClick={() => setSelected(person.id)}><span className="admin-avatar inline-flex items-center justify-center">{initials(person.name)}</span><strong className="block text-sm">{person.name}</strong><span className="mt-2 block text-xs text-muted-foreground">{person.country}</span><span className="admin-client-meta"><span><small>Source</small><strong>{person.source}</strong></span><span><small>Journey</small><strong>{demo.trips.some((trip) => trip.client_id === person.id) ? "Confirmed" : "Enquiring"}</strong></span></span></button>)}</div>{client && <div className="admin-panel mt-5 p-6" role="status"><h2 className="admin-panel-heading">{client.name}</h2><p className="mt-2 text-sm text-muted-foreground">{client.country} · {client.source}</p><p className="mt-3 text-sm">{demo.trips.find((trip) => trip.client_id === client.id)?.title ?? "No confirmed journey yet."}</p></div>}</>}
    {view === "reservations" && <div className="admin-panel p-5"><ReservationCalendar events={events} onSelect={setReservation} />{reservation && <div className="mt-5 border-t border-border pt-5" role="status"><h2 className="admin-panel-heading">{reservation.name}</h2><p className="mt-2 text-sm">{reservation.title} · {reservation.startsOn} — {reservation.endsOn}</p></div>}</div>}
    {view === "enquiries" && <><section className="admin-panel p-6"><h2 className="admin-panel-heading">Recent enquiries</h2>{demo.leads.map((item) => <button key={item.id} type="button" className="admin-row w-full text-left" onClick={() => setSelected(item.id)}><span className="admin-avatar">{initials(item.name)}</span><span className="min-w-0 flex-1"><strong className="block text-xs font-medium">{item.name}</strong><small className="block text-xs text-muted-foreground">{item.residence} · Follow up {item.follow_up_on}</small></span><span className="admin-status">{item.status.replaceAll("_", " ")}</span></button>)}</section>{lead && <section className="admin-panel mt-5 p-6" role="status"><h2 className="admin-panel-heading">{lead.name}</h2><p className="mt-2 text-sm text-muted-foreground">{lead.residence} · {lead.status.replaceAll("_", " ")}</p><p className="mt-3 text-sm">{lead.brief}</p></section>}</>}
  </>;
}
