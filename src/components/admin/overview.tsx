import { Link } from "@tanstack/react-router";
import { CalendarDays, Users, Mail, ArrowUpRight, Plus, Compass } from "lucide-react";
import { useWorkspace } from "@/lib/admin-workspace-api";
import { dayUtc, isActiveTrip, tripEnd, initials } from "@/lib/admin-workspace";
import { WorkspaceState } from "./workspace-state";
import { HelpPanel } from "./help-panel";
export function Overview() {
  const query = useWorkspace();
  const data = query.data;
  const today = dayUtc();
  const trips = data?.trips ?? [];
  const upcoming = trips
    .filter((t) => t.status === "confirmed" && tripEnd(t) >= today)
    .sort((a, b) => a.starts_on.localeCompare(b.starts_on));
  const clients = data?.clients.filter((c) => !c.archived) ?? [];
  const leads = data?.leads ?? [];
  const open = leads.filter((l) => !["closed", "confirmed"].includes(l.status));
  const overdueFollowUps = open.filter((lead) => lead.follow_up_on && lead.follow_up_on < today);
  const todayFollowUps = open.filter((lead) => lead.follow_up_on === today);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">PELICAN OPERATIONS</p>
          <h1 className="mt-2">Overview</h1>
          <p>Review upcoming trips, outstanding enquiries and client records.</p>
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
              label: "Active trips",
              value: trips.filter((t) => isActiveTrip(t, today)).length,
              note: "Confirmed trips active today",
              Icon: Compass,
              to: "/admin/bookings",
            },
            {
              label: "Upcoming departures",
              value: upcoming.filter((t) => t.starts_on > today).length,
              note: "Future confirmed trip records",
              Icon: CalendarDays,
              to: "/admin/bookings",
            },
            {
              label: "Open enquiries",
              value: open.length,
              note: "Enquiries awaiting review or follow-up",
              Icon: Mail,
              to: "/dashboard",
            },
            {
              label: "Clients",
              value: clients.length,
              note: "Current client profiles",
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    Confirmed trips recorded in Reservations.
                  </p>
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
                      <span className="admin-avatar !h-8 !w-8 !text-xs">
                        {initials(lead.name)}
                      </span>
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
            <section className="admin-panel p-5" aria-label="Enquiry follow-ups">
              <h2 className="admin-panel-heading">Follow-ups</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Open enquiries with scheduled follow-up dates.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 border-y border-border py-4">
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{todayFollowUps.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Due today</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{overdueFollowUps.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
              <Link to="/dashboard" className="mt-4 inline-block text-sm font-medium text-primary">
                Review enquiries →
              </Link>
            </section>
            <HelpPanel />
            <section className="admin-panel p-5">
              <h2 className="admin-panel-heading">Website content</h2>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Save drafts, review changes and publish packages or photos when they are ready.
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
