import { AppSelect } from "@/components/ui/app-select";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ItineraryDraft } from "@/components/itinerary-draft";
import { Section } from "@/components/site";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { checkTravellerSession } from "@/lib/traveller-session";
import { isStaffDeviceTrusted } from "@/lib/trusted-staff-device";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
type Tables = Database["public"]["Tables"];
type Proposal = Tables["proposals"]["Row"];
type Version = Tables["proposal_versions"]["Row"];
type Request = Tables["proposal_requests"]["Row"];
// This RPC's migration may be awaiting deployment. Keep its contract local
// rather than modifying generated types or bypassing its server authorization.
type QuoteRecipient = {
  client_id: string;
  traveller_id: string;
  enquiry_id: string | null;
  name: string;
  email: string;
};
type QuoteDatabase = Database & {
  public: {
    Functions: {
      quote_recipients: {
        Args: Record<string, never>;
        Returns: QuoteRecipient[];
      };
    };
  };
};
const quoteClient = supabase as SupabaseClient<QuoteDatabase>;
export const Route = createFileRoute("/proposals")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { id?: string } =>
    typeof s["id"] === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s["id"])
      ? { id: s["id"] }
      : {},
  head: () => ({
    meta: [
      { title: "Private quotes — Pelican Tours and Safaris" },
      { name: "description", content: "Review your private Pelican safari quotes and requested itinerary changes." },
      { property: "og:title", content: "Private quotes — Pelican Tours and Safaris" },
      { property: "og:description", content: "Review your private Pelican safari quotes and requested itinerary changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async ({ location }) => {
    const { data, error } = await checkTravellerSession(() => supabase.auth.getUser());
    if (error || !data.user) throw redirect({ to: "/auth", search: { next: location.href } });
    const role = await supabase.rpc("can_manage_site");
    if (!role.error && role.data) {
      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      return {
        user: data.user,
        adminAssurance:
          !assurance.error &&
          assurance.data.currentLevel === "aal2" &&
          isStaffDeviceTrusted(data.user.id)
            ? "aal2"
            : undefined,
      };
    }
    return { user: data.user, adminAssurance: undefined };
  },
  component: Proposals,
  pendingMs: 0,
  pendingComponent: () => (
    <Section>
      <h1 className="text-5xl font-bold">Private quotes</h1>
      <p className="mt-8" role="status">
        Checking your sign-in…
      </p>
    </Section>
  ),
});
const textFields = ["itinerary", "accommodation", "inclusions", "exclusions", "terms"] as const;
const labels = {
  itinerary: "Day-by-day itinerary, overnight stops and travel expectations",
  accommodation: "Accommodation and room details",
  inclusions: "Included",
  exclusions: "Excluded",
  terms: "Payment, cancellation and booking terms",
};
const empty = {
  itinerary: "",
  accommodation: "",
  inclusions: "",
  exclusions: "",
  terms: "",
  currency: "NAD",
  total: "",
  valid_until: "",
};
function Proposals() {
  const { user, adminAssurance } = Route.useRouteContext();
  const adminView = adminAssurance === "aal2";
  const search = Route.useSearch();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [staff, setStaff] = useState(false);
  const [selected, setSelected] = useState(search.id ?? "");
  const [versionId, setVersionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [recipients, setRecipients] = useState<QuoteRecipient[]>([]);
  const [recipient, setRecipient] = useState("");
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState(empty);
  const [revision, setRevision] = useState("");
  const current = proposals.find((p) => p.id === selected) ?? proposals[0];
  const relevant = versions.filter((v) => v.proposal_id === current?.id);
  const latest = relevant[0];
  const viewing = relevant.find((v) => v.id === versionId) ?? latest;
  async function load() {
    setLoading(true);
    try {
      const role = await supabase.rpc("can_manage_site");
      if (role.error) throw role.error;
      setStaff(!!role.data);
      const [p, v, r, people] = await Promise.all([
        supabase.from("proposals").select("*").order("created_at", { ascending: false }),
        supabase.from("proposal_versions").select("*").order("version", { ascending: false }),
        supabase.from("proposal_requests").select("*").order("created_at", { ascending: false }),
        role.data ? quoteClient.rpc("quote_recipients") : Promise.resolve({ data: [], error: null }),
      ]);
      if (p.error || v.error || r.error || people.error)
        throw p.error || v.error || r.error || people.error;
      setProposals(p.data ?? []);
      setVersions(v.data ?? []);
      setRequests(r.data ?? []);
      setRecipients(people.data ?? []);
    } catch {
      setMessage("Quotes could not be loaded. Please retry.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [user.id]);
  useEffect(() => {
    setVersionId("");
    setRevision("");
    setDraft(latest ? { ...latest, total: String(latest.total) } : empty);
  }, [current?.id, latest?.id]);
  async function perform(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch {
      setMessage("The change was not saved. Reload to check for updates and try again.");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <Section className="quote-workspace">
      <div className="quote-workspace-heading">
        <div>
          {adminView && <p className="admin-eyebrow">PRICING & ITINERARIES</p>}
          <h1 className="font-display text-5xl">Private quotes</h1>
          <p className="text-muted-foreground">
            {adminView
              ? "Prepare verified trip details for the assigned traveller. A quote is not a confirmed booking."
              : "Only quotes assigned to your signed-in account appear here. A quote is not a confirmed booking."}
          </p>
        </div>
        <Button variant="outline" disabled={busy || loading} onClick={load}>
          Reload quotes
        </Button>
      </div>
      <p role="status" className="quote-workspace-message">
        {message}
      </p>
      {loading ? (
        <p className="mt-6">Loading…</p>
      ) : (
        <>
          <label className="quote-workspace-picker">
            Select quote
            <AppSelect
              className="mt-2 w-full border-b bg-transparent py-3"
              value={current?.id ?? ""}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="" disabled>
                Select
              </option>
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </AppSelect>
          </label>
          {!current && (
            <p className="mt-6">No quotes yet. Contact Pelican to have a private quote prepared.</p>
          )}
          {current && (
            <>
              <Button
                className="mt-4"
                variant="outline"
                onClick={async () => {
                  const url = new URL("/proposals", location.origin);
                  url.searchParams.set("id", current.id);
                  try {
                    await navigator.clipboard.writeText(url.href);
                    setMessage("Private link copied. The assigned traveller must sign in.");
                  } catch {
                    setMessage(url.href);
                  }
                }}
              >
                Copy private link
              </Button>
              {viewing ? (
                <article className="quote-document">
                  <h2 className="text-3xl">{current.title}</h2>
                  <label className="mt-4 block">
                    Quote version
                    <AppSelect
                      className="ml-4 border-b bg-transparent py-2"
                      value={viewing.id}
                      onChange={(e) => setVersionId(e.target.value)}
                    >
                      {relevant.map((v) => (
                        <option key={v.id} value={v.id}>
                          Version {v.version}
                        </option>
                      ))}
                    </AppSelect>
                  </label>
                  <p className="mt-4">
                    Total: {viewing.currency}{" "}
                    {Number(viewing.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                    · Valid through {viewing.valid_until}
                  </p>
                  {viewing.valid_until < new Date().toISOString().slice(0, 10) && (
                    <p className="mt-3">
                      This quote has expired. Ask Pelican for an updated quote.
                    </p>
                  )}
                  {textFields.map((key) => (
                    <section key={key} className="border-b py-6">
                      <h3 className="text-xl">{labels[key]}</h3>
                      <p className="mt-3 whitespace-pre-wrap">{viewing[key]}</p>
                    </section>
                  ))}
                  {current.traveller_id === user.id && (
                    <form
                      className="mt-8"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void perform(async () => {
                          const result = await supabase.from("proposal_requests").insert({
                            version_id: viewing.id,
                            traveller_id: user.id,
                            message: revision.trim(),
                          });
                          if (result.error) throw result.error;
                          setRevision("");
                          await load();
                          setMessage("Your change request was sent to Pelican.");
                        });
                      }}
                    >
                      <label>
                        Request changes
                        <textarea
                          required
                          minLength={1}
                          maxLength={4000}
                          rows={4}
                          className="mt-2 w-full border bg-transparent p-3"
                          value={revision}
                          onChange={(e) => setRevision(e.target.value)}
                        />
                      </label>
                      <Button disabled={busy || !revision.trim()} className="mt-4">
                        Send change request
                      </Button>
                    </form>
                  )}
                  <h3 className="mt-8 text-xl">Change requests for this version</h3>
                  {requests
                    .filter((r) => r.version_id === viewing.id)
                    .map((r) => (
                      <p key={r.id} className="mt-4 whitespace-pre-wrap">
                        {new Date(r.created_at).toLocaleString()} — {r.message}
                      </p>
                    ))}
                </article>
              ) : (
                <p className="mt-6">No published version yet.</p>
              )}
            </>
          )}
          {staff && (
            <>
              <h2 className="quote-section-title">Create quote</h2>
              <form
                className="quote-editor grid gap-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  void perform(async () => {
                    const person = recipients.find((item) => item.client_id === recipient);
                    if (!person) throw new Error("Choose a client");
                    const result = await supabase
                      .from("proposals")
                      .insert({
                        traveller_id: person.traveller_id,
                        title: title.trim(),
                        enquiry_id: person.enquiry_id,
                      })
                      .select()
                      .single();
                    if (result.error || !result.data) throw result.error;
                    setSelected(result.data.id);
                    await load();
                    setTitle("");
                    setRecipient("");
                    setMessage("Quote created. Publish the verified details below.");
                  });
                }}
              >
                <label>
                  Client
                  <AppSelect
                    required
                    className="mt-2 w-full border-b bg-transparent py-3"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  >
                    <option value="">Choose a client with a verified traveller account</option>
                    {recipients.map((person) => (
                      <option key={person.client_id} value={person.client_id}>
                        {person.name} · {person.email}
                      </option>
                    ))}
                  </AppSelect>
                  {!recipients.length && (
                    <span className="mt-2 block text-sm text-muted-foreground">
                      Add the client first. Their client email must match a verified traveller
                      sign-in.
                    </span>
                  )}
                </label>
                <label>
                  Title
                  <input
                    required
                    maxLength={200}
                    className="mt-2 w-full border-b bg-transparent py-3"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <Button disabled={busy || !recipient}>Create quote</Button>
              </form>
              {current && (
                <ItineraryDraft
                  key={current.id}
                  enquiryId={current.enquiry_id}
                  quote={draft}
                  onApply={(itinerary) => setDraft((previous) => ({ ...previous, itinerary }))}
                />
              )}
              {current && (
                <form
                  className="quote-editor mt-6 space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void perform(async () => {
                      const result = await supabase.rpc("publish_proposal", {
                        _proposal_id: current.id,
                        _expected_version: latest?.version ?? 0,
                        _details: { ...draft, total: Number(draft.total) },
                      });
                      if (result.error) throw result.error;
                      await load();
                      setMessage("A new immutable quote version was published to the traveller.");
                    });
                  }}
                >
                  <h2 className="text-3xl">Publish version {(latest?.version ?? 0) + 1}</h2>
                  <p>
                    Confirm all facts, supplier availability and terms. Published versions are
                    retained; changes require a new version.
                  </p>
                  {textFields.map((key) => (
                    <label key={key} className="block">
                      {labels[key]}
                      <textarea
                        required
                        maxLength={key === "itinerary" || key === "terms" ? 12000 : 8000}
                        rows={5}
                        className="mt-2 w-full border bg-transparent p-3"
                        value={draft[key]}
                        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                      />
                    </label>
                  ))}
                  <div className="grid gap-6 md:grid-cols-3">
                    <label>
                      Currency
                      <AppSelect
                        className="mt-2 w-full border-b bg-transparent py-3"
                        value={draft.currency}
                        onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                      >
                        {["NAD", "USD", "EUR", "GBP", "ZAR"].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </AppSelect>
                    </label>
                    <label>
                      Total quote
                      <input
                        required
                        type="number"
                        min="0.01"
                        max="999999999999.99"
                        step="0.01"
                        className="mt-2 w-full border-b bg-transparent py-3"
                        value={draft.total}
                        onChange={(e) => setDraft({ ...draft, total: e.target.value })}
                      />
                    </label>
                    <label>
                      Valid through
                      <input
                        required
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        className="mt-2 w-full border-b bg-transparent py-3"
                        value={draft.valid_until}
                        onChange={(e) => setDraft({ ...draft, valid_until: e.target.value })}
                      />
                    </label>
                  </div>
                  <Button disabled={busy}>Publish to traveller</Button>
                </form>
              )}
            </>
          )}
        </>
      )}
    </Section>
  );
}
