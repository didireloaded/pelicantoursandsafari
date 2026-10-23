import { Link } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, Mail, TriangleAlert } from "lucide-react";
import { useWorkspace } from "@/lib/admin-workspace-api";
import { dayUtc, initials } from "@/lib/admin-workspace";
import { WorkspaceState } from "./workspace-state";

export function FollowUps() {
  const query = useWorkspace();
  const today = dayUtc();
  const rows = (query.data?.leads ?? [])
    .filter((lead) => !["closed", "confirmed"].includes(lead.status))
    .sort((a, b) => (a.follow_up_on ?? "9999-12-31").localeCompare(b.follow_up_on ?? "9999-12-31"));
  const overdue = rows.filter((lead) => lead.follow_up_on && lead.follow_up_on < today);
  const dueToday = rows.filter((lead) => lead.follow_up_on === today);
  const upcoming = rows.filter((lead) => lead.follow_up_on && lead.follow_up_on > today);
  const unscheduled = rows.filter((lead) => !lead.follow_up_on);

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">NEXT CLIENT ACTIONS</p>
          <h1 className="mt-2">Tasks & follow-ups</h1>
          <p>Traveller callbacks and follow-up dates from your enquiry workflow.</p>
        </div>
        <Link to="/dashboard" className="admin-action-link">
          Open enquiry inbox
        </Link>
      </div>
      <WorkspaceState
        loading={query.isPending}
        error={query.isError}
        retry={() => void query.refetch()}
      >
        <div className="admin-stats">
          {[
            { label: "Overdue", value: overdue.length, Icon: TriangleAlert },
            { label: "Due today", value: dueToday.length, Icon: CalendarClock },
            { label: "Upcoming", value: upcoming.length, Icon: CheckCircle2 },
            { label: "No follow-up date", value: unscheduled.length, Icon: Mail },
          ].map(({ label, value, Icon }) => {
            return (
              <div className="admin-panel admin-stat" key={label}>
                <div className="admin-stat-label">
                  {label}
                  <Icon size={16} />
                </div>
                <p className="admin-stat-value">{value}</p>
                <p className="admin-stat-note">Open enquiries</p>
              </div>
            );
          })}
        </div>
        <section className="admin-panel p-6">
          <h2 className="admin-panel-heading">Follow-up queue</h2>
          {rows.length ? (
            rows.map((lead) => (
              <Link to="/dashboard" key={lead.id} className="admin-row">
                <span className="admin-avatar">{initials(lead.name)}</span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs font-medium">{lead.name}</strong>
                  <small className="block text-xs text-muted-foreground">
                    {lead.residence || "Country not supplied"} · {lead.status.replaceAll("_", " ")}
                  </small>
                </span>
                <span
                  className={`admin-status ${lead.follow_up_on && lead.follow_up_on < today ? "overdue" : ""}`}
                >
                  {lead.follow_up_on
                    ? lead.follow_up_on === today
                      ? "Today"
                      : lead.follow_up_on
                    : "Not scheduled"}
                </span>
              </Link>
            ))
          ) : (
            <div className="admin-empty">No open enquiries need follow-up.</div>
          )}
        </section>
        <p className="mt-4 text-xs text-muted-foreground">
          Follow-ups are completed by updating the enquiry status or choosing its next follow-up
          date in the enquiry inbox.
        </p>
      </WorkspaceState>
    </>
  );
}
