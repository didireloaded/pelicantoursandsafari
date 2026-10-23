import { Link } from "@tanstack/react-router";
import { Banknote, CircleDollarSign, ReceiptText, TriangleAlert } from "lucide-react";
import { useWorkspace } from "@/lib/admin-workspace-api";
import { formatNad } from "@/lib/safari-package";
import { WorkspaceState } from "./workspace-state";

export function paymentStatus(total: number | null, paid: number | null) {
  if (total === null || paid === null) return "Needs amounts";
  if (total > 0 && paid >= total) return "Paid";
  if (paid > 0) return "Part-paid";
  return "Outstanding";
}

export function Payments() {
  const query = useWorkspace("payments");
  const trips = query.data?.trips ?? [];
  const recorded = trips.filter((trip) => trip.total_nad !== null || trip.paid_nad !== null);
  const total = recorded.reduce((sum, trip) => sum + (trip.total_nad ?? 0), 0);
  const received = recorded.reduce((sum, trip) => sum + (trip.paid_nad ?? 0), 0);
  const knownOutstanding = recorded
    .filter((trip) => trip.total_nad !== null && trip.paid_nad !== null)
    .reduce((sum, trip) => sum + (trip.total_nad! - trip.paid_nad!), 0);
  const incomplete = trips.filter((trip) => trip.total_nad === null || trip.paid_nad === null);

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">RECORDED AMOUNTS</p>
          <h1 className="mt-2">Payments & invoices</h1>
          <p>Track amounts entered by staff. No payment is processed through this screen.</p>
        </div>
        <Link to="/admin/bookings" className="admin-action-link">
          Update reservation amounts
        </Link>
      </div>
      <WorkspaceState
        loading={query.isPending}
        error={query.isError}
        retry={() => void query.refetch()}
      >
        <div className="admin-stats">
          {[
            { label: "Recorded trip value", value: formatNad(total), Icon: CircleDollarSign },
            { label: "Amount received", value: formatNad(received), Icon: Banknote },
            { label: "Known outstanding", value: formatNad(knownOutstanding), Icon: ReceiptText },
            {
              label: "Needs amount details",
              value: String(incomplete.length),
              Icon: TriangleAlert,
            },
          ].map(({ label, value, Icon }) => {
            return (
              <div className="admin-panel admin-stat" key={label}>
                <div className="admin-stat-label">
                  {label}
                  <Icon size={16} />
                </div>
                <p className="admin-stat-value admin-stat-money">{String(value)}</p>
                <p className="admin-stat-note">Staff records</p>
              </div>
            );
          })}
        </div>
        <section className="admin-panel p-6">
          <h2 className="admin-panel-heading">Reservation payment tracking</h2>
          {trips.length ? (
            trips.map((trip) => {
              const client = query.data?.clients.find((person) => person.id === trip.client_id);
              const balance =
                trip.total_nad !== null && trip.paid_nad !== null
                  ? trip.total_nad - trip.paid_nad
                  : null;
              return (
                <Link
                  to="/admin/bookings"
                  search={{ reservation: trip.id }}
                  className="admin-row admin-payment-row"
                  key={trip.id}
                  aria-label={`Open ${trip.title} reservation`}
                >
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-xs font-medium">{trip.title}</strong>
                    <small className="block text-xs text-muted-foreground">
                      {client?.name ?? "Traveller account"} · {trip.starts_on}
                    </small>
                  </span>
                  <dl className="admin-payment-values">
                    <div>
                      <dt>Total</dt>
                      <dd>
                        {trip.total_nad === null ? "Not recorded" : formatNad(trip.total_nad)}
                      </dd>
                    </div>
                    <div>
                      <dt>Received</dt>
                      <dd>{trip.paid_nad === null ? "Not recorded" : formatNad(trip.paid_nad)}</dd>
                    </div>
                    <div>
                      <dt>Balance</dt>
                      <dd>{balance === null ? "Not available" : formatNad(balance)}</dd>
                    </div>
                  </dl>
                  <span className="admin-pill">{paymentStatus(trip.total_nad, trip.paid_nad)}</span>
                </Link>
              );
            })
          ) : (
            <div className="admin-empty">No reservations have been recorded yet.</div>
          )}
        </section>
        <div className="admin-panel mt-5 p-5 text-xs text-muted-foreground" role="note">
          This is an internal payment tracker. It does not charge cards, verify bank transfers or
          issue tax invoices. Staff should reconcile recorded amounts with Pelican’s bank records.
        </div>
      </WorkspaceState>
    </>
  );
}
