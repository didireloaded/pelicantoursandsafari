import { Link } from "@tanstack/react-router";
import { CalendarDays, Users, Mail, ArrowUpRight, Plus, Compass } from "lucide-react";
import { useWorkspace } from "@/lib/admin-workspace-api";
import { dayUtc, isActiveTrip, tripEnd, initials } from "@/lib/admin-workspace";
import { WorkspaceState } from "./workspace-state";
import { HelpPanel } from "./help-panel";
export function Overview() {
  const query = useWorkspace("overview");
  const data = query.data;
  const today = dayUtc();
  const trips = data?.trips ?? [];
  const upcoming = trips
    .filter((t) => t.status === "confirmed" && tripEnd(t) >= today)
    .sort((a, b) => a.starts_on.localeCompare(b.starts_on));
  const clients = data?.clients.filter((c) => !c.archived) ?? [];
  const leads = data?.leads ?? [];
  const open = leads.filter((l) => !["closed", "confirmed"].includes(l.status));
  const newEnquiries = open.filter((l) => l.status === "new").length;
  const followUpsDue = open.filter((l) => l.follow_up_on && l.follow_up_on <= today).length;
  const undatedBookings = leads.filter(
    (l) => l.booking_ref && l.status === "confirmed" && !l.confirmed_starts_on,
  ).length;
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">PELICAN WORKSPACE</p>
          <h1 className="mt-2">Today’s overview</h1>
          <p>Enquiries, confirmed journeys and follow-ups in one place.</p>
        </div>
        <Link
          to="/admin/bookings"
          className="admin-pill !border-primary !bg-primary !text-primary-foreground"
        >
          <Plus size={14} />
          Open reservations
        </Link>
      </div>
      <WorkspaceState
        loading={query.isPending}
        error={query.isError}
        retry={() => void query.refetch()}
      >
        <div className="admin-stats">
          {[
            {
              label: "Active bookings",
              value: trips.filter((t) => isActiveTrip(t, today)).length,
              note: "Confirmed trips travelling today",
              Icon: Compass,
              to: "/admin/bookings",
            },
            {
              label: "Upcoming departures",
              value: upcoming.filter((t) => t.starts_on > today).length,
              note: "Confirmed, future journeys",
              Icon: CalendarDays,
              to: "/admin/bookings",
            },
            {
              label: "Open enquiries",
              value: open.length,
              note: "Requests awaiting a decision",
              Icon: Mail,
              to: "/dashboard",
            },
            {
              label: "Clients",
              value: clients.length,
              note: "Your current client directory",
              Icon: Users,
              to: "/admin/clients",
            },
          ].map((item) => (
            <Link to={item.to} key={item.label} className="admin-panel admin-stat">
              <div className="admin-stat-label">
                {item.label}
                <item.Icon size={16} />
              </div>
              <p className="admin-stat-value">{item.value}</p>
              <p className="admin-stat-note">{item.note}</p>
            </Link>
          ))}
        </div>
        <div className="admin-main-grid">
          <div className="space-y-5">
            <section className="admin-panel p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="admin-panel-heading">Upcoming journeys</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Confirmed departures ahead.</p>
                </div>
                <Link to="/admin/bookings" className="text-xs text-primary">
                  View calendar →
                </Link>
              </div>
              {upcoming.length ? (
                upcoming.slice(0, 5).map((trip) => {
                  const client = clients.find((c) => c.id === trip.client_id);
                  return (
                    <Link to="/admin/bookings" key={trip.id} className="admin-row">
                      <span className="admin-avatar">{initials(client?.name ?? trip.title)}</span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-xs font-medium">{trip.title}</strong>
                        <small className="block text-xs text-muted-foreground">
                          {client?.name ?? "Traveller account"} · {trip.starts_on} — {tripEnd(trip)}
                        </small>
                      </span>
                      <span className="admin-status confirmed">Confirmed</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  );
                })
              ) : (
                <div className="admin-empty">
                  <CalendarDays size={27} className="mx-auto mb-3 opacity-40" />
                  <p>No upcoming confirmed journeys yet.</p>
                  <Link to="/admin/bookings" className="mt-3 inline-block text-primary">
                    Create a reservation →
                  </Link>
                </div>
              )}
            </section>
            <section className="admin-panel p-6">
              <div className="flex items-center justify-between">
                <h2 className="admin-panel-heading">Recent enquiries</h2>
                <Link to="/dashboard" className="text-xs text-primary">
                  Open inbox →
                </Link>
              </div>
              {leads.length ? (
                [...leads]
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .slice(0, 4)
                  .map((lead) => (
                    <Link to="/dashboard" key={lead.id} className="admin-row">
                      <span className="admin-avatar !h-8 !w-8 !text-xs">{initials(lead.name)}</span>
                      <div className="flex-1">
                        <strong className="block text-xs font-medium">{lead.name}</strong>
                        <small className="text-xs text-muted-foreground">
                          {lead.created_at.slice(0, 10)} ·{" "}
                          {lead.residence || "Country not supplied"}
                        </small>
                      </div>
                      <span className="admin-status">{lead.status.replaceAll("_", " ")}</span>
                    </Link>
                  ))
              ) : (
                <p className="admin-empty">New enquiries will appear here after submission.</p>
              )}
            </section>
          </div>
          <aside className="admin-detail-rail">
            <section className="admin-panel p-5">
              <h2 className="admin-panel-heading">Needs attention</h2>
              <div className="mt-3 divide-y divide-border">
                <Link to="/dashboard" className="admin-row justify-between">
                  <span>New enquiries</span>
                  <strong>{newEnquiries}</strong>
                </Link>
                <Link to="/dashboard" className="admin-row justify-between">
                  <span>Follow-ups due</span>
                  <strong>{followUpsDue}</strong>
                </Link>
                <Link to="/admin/bookings" className="admin-row justify-between">
                  <span>Confirmed requests needing dates</span>
                  <strong>{undatedBookings}</strong>
                </Link>
              </div>
            </section>
            <HelpPanel />
            <section className="admin-panel p-5">
              <h2 className="admin-panel-heading">Ready to publish?</h2>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Save a draft, preview it, then publish. Your website updates without a code
                deployment.
              </p>
              <div className="mt-4 flex gap-3">
                <Link to="/admin/gallery" className="admin-pill">
                  Gallery
                </Link>
                <Link to="/admin/packages" className="admin-pill">
                  Packages
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </WorkspaceState>
    </>
  );
}
