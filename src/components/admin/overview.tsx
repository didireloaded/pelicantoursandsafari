import { Link } from "@tanstack/react-router";
import { CalendarDays, Users, Mail, ArrowUpRight, Plus, Compass } from "lucide-react";
import { useWorkspace } from "@/lib/admin-workspace-api";
import { dayUtc, isActiveTrip, tripEnd, initials } from "@/lib/admin-workspace";
import { WorkspaceState } from "./workspace-state";
import { HelpPanel } from "./help-panel";
import { ContentPhoto } from "@/components/content-photo";
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
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">YOUR PELICAN WORKSPACE</p>
          <h1 className="mt-2">A good day for a new journey.</h1>
          <p>Your guests, upcoming safaris and the details that need your attention.</p>
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
              note: "Requests waiting to become journeys",
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
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    A clear view of the next departures.
                  </p>
                </div>
                <Link to="/admin/bookings" className="text-[10px] text-primary">
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
                        <small className="block text-[10px] text-muted-foreground">
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
                <Link to="/dashboard" className="text-[10px] text-primary">
                  Open inbox →
                </Link>
              </div>
              {leads.length ? (
                [...leads]
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .slice(0, 4)
                  .map((lead) => (
                    <Link to="/dashboard" key={lead.id} className="admin-row">
                      <span className="admin-avatar !h-8 !w-8 !text-[10px]">
                        {initials(lead.name)}
                      </span>
                      <div className="flex-1">
                        <strong className="block text-xs font-medium">{lead.name}</strong>
                        <small className="text-[10px] text-muted-foreground">
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
              <h2 className="admin-panel-heading">A little closer to the wild.</h2>
              <div className="mt-4 overflow-hidden rounded-xl">
                <img
                  src="/images/rhino-640.webp"
                  alt="Rhino in Namibia"
                  width="640"
                  height="427"
                  className="h-32 w-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Build the journeys your guests will remember. Start with the details, then make them
                your own.
              </p>
              <Link
                to="/admin/packages"
                className="mt-4 inline-block text-[11px] font-medium text-primary"
              >
                Manage packages →
              </Link>
            </section>
            <HelpPanel />
            <section className="admin-panel p-5">
              <h2 className="admin-panel-heading">Ready to publish?</h2>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
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
