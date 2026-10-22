import { useState } from "react";
import { sampleWorkspace } from "@/lib/admin-sample-data";
import { initials } from "@/lib/admin-workspace";

export function SampleEnquiries() {
  const [selected, setSelected] = useState("sample-enquiry-1");
  const data = sampleWorkspace();
  const current = data.leads.find((lead) => lead.id === selected);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">ENQUIRY INBOX</p>
          <h1 className="mt-2">Traveller enquiries</h1>
          <p>Example requests in different stages of the booking process.</p>
        </div>
      </div>
      <div className="admin-main-grid">
        <section className="admin-panel p-5">
          <h2 className="admin-panel-heading">Recent enquiries</h2>
          <div className="mt-3 divide-y divide-border">
            {data.leads.map((lead) => (
              <button
                type="button"
                key={lead.id}
                onClick={() => setSelected(lead.id)}
                aria-pressed={lead.id === selected}
                className="admin-row w-full rounded-md px-2 text-left hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="admin-avatar">{initials(lead.name)}</span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-medium">{lead.name}</strong>
                  <small className="block text-xs text-muted-foreground">{lead.residence} · {lead.created_at.slice(0, 10)}</small>
                </span>
                <span className="admin-status">{lead.status.replaceAll("_", " ")}</span>
              </button>
            ))}
          </div>
        </section>
        <aside className="admin-panel p-6">
          <h2 className="admin-panel-heading">Enquiry details</h2>
          {current && (
            <div className="mt-5 space-y-4 text-sm">
              <div><strong className="text-lg">{current.name}</strong><p className="text-muted-foreground">{current.residence}</p></div>
              <div className="border-y border-border py-4"><p className="text-xs text-muted-foreground">Status</p><p className="mt-1 font-medium">{current.status.replaceAll("_", " ")}</p></div>
              <div><p className="text-xs text-muted-foreground">Trip request</p><p className="mt-2 leading-relaxed">{current.brief}</p></div>
              <div><p className="text-xs text-muted-foreground">Follow-up</p><p className="mt-1">{current.follow_up_on ?? "Not scheduled"}</p></div>
              <p className="border-t border-border pt-4 text-xs text-muted-foreground">Sample only. No messages will be sent and no booking will be created.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
