import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { validateDraftInput } from "../../supabase/functions/_shared/itinerary-draft";
type QuoteFields = {
  currency: string;
  total: string;
  terms: string;
  accommodation: string;
  inclusions: string;
  exclusions: string;
  valid_until: string;
};
export function ItineraryDraft({
  enquiryId,
  quote,
  onApply,
}: {
  enquiryId: string | null;
  quote: QuoteFields;
  onApply: (itinerary: string) => void;
}) {
  const [brief, setBrief] = useState("");
  const [details, setDetails] = useState("");
  const [days, setDays] = useState("1");
  const [result, setResult] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [approved, setApproved] = useState<{ id: string; title: string; body: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [sourceError, setSourceError] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await supabase
          .from("travel_details")
          .select("id,title,body")
          .eq("category", "itinerary")
          .eq("approved", true)
          .order("title");
        if (response.error) throw response.error;
        if (active) setApproved(response.data ?? []);
      } catch {
        if (active)
          setSourceError(
            "Approved tour details could not be loaded. You can enter verified details below.",
          );
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  async function loadBrief() {
    if (!enquiryId || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const response = await supabase
        .from("enquiries")
        .select("brief")
        .eq("id", enquiryId)
        .single();
      if (response.error || !response.data) throw response.error;
      setBrief(response.data.brief);
      setResult("");
      setMessage(
        "Brief loaded for review. Remove any personal or sensitive information before generating.",
      );
    } catch {
      setMessage("The linked Safari Brief could not be loaded. Paste its trip preferences below.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function generate() {
    if (lock.current) return;
    let input;
    try {
      input = validateDraftInput({
        brief,
        days: Number(days),
        details: details
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Check your brief and tour details.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setResult("");
    setMessage("");
    try {
      const response = await supabase.functions.invoke("draft-itinerary", { body: input });
      if (response.error) {
        let text =
          "Drafting failed. Check your session and Lovable AI configuration, or try again later.";
        try {
          const body = await response.error.context?.json();
          if (typeof body?.error === "string") text = body.error;
        } catch {
          /* Keep the safe fallback. */
        }
        throw new Error(text);
      }
      if (typeof response.data?.itinerary !== "string" || !response.data.itinerary)
        throw new Error("No valid itinerary was returned. Please retry.");
      setResult(response.data.itinerary);
      setMessage(
        "Review this provisional sequence and the supplied quote fields before applying. Nothing has been published.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Drafting failed. Please try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const field = "mt-2 w-full border border-border bg-transparent p-3";
  return (
    <details className="mt-10 border-y border-border py-6">
      <summary className="cursor-pointer text-xl">Draft itinerary quote with Lovable AI</summary>
      <div className="mt-6 space-y-6">
        <p className="text-muted-foreground">
          AI arranges the supplied tour details around the traveller’s preferences. It cannot add
          activities, prices or deposit terms. Generating sends trip preferences and tour details to
          Lovable AI and uses workspace AI credits. Remove contact, passport and health information
          first. Drafts stay on this screen until you apply or publish them.
        </p>
        {enquiryId && (
          <Button type="button" variant="outline" disabled={busy} onClick={loadBrief}>
            Load linked Safari Brief
          </Button>
        )}
        <label className="block">
          Safari Brief trip preferences
          <textarea
            className={field}
            rows={6}
            maxLength={8000}
            value={brief}
            disabled={busy}
            onChange={(e) => {
              setBrief(e.target.value);
              setResult("");
            }}
          />
        </label>
        {sourceError && <p role="status">{sourceError}</p>}
        {!!approved.length && (
          <div>
            <label>
              Approved tour detail
              <select
                className="mt-2 w-full border-b bg-transparent py-3"
                disabled={busy}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Choose a verified entry</option>
                {approved.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              disabled={busy || !selected}
              onClick={() => {
                const entry = approved.find((item) => item.id === selected);
                if (entry) {
                  setDetails((previous) =>
                    [previous, `${entry.title}: ${entry.body.replace(/\s*\n\s*/g, " ")}`]
                      .filter(Boolean)
                      .join("\n"),
                  );
                  setResult("");
                }
              }}
            >
              Add selected detail
            </Button>
          </div>
        )}
        <label className="block">
          Selected tour details
          <textarea
            aria-label="Selected tour details"
            className={field}
            rows={7}
            maxLength={10000}
            value={details}
            disabled={busy}
            onChange={(e) => {
              setDetails(e.target.value);
              setResult("");
            }}
          />
          <span className="mt-2 block text-sm text-muted-foreground">
            One confirmed stop or activity per line, including overnight location and travel
            expectations when known. Provide at least one block per day, up to 30 blocks. AI uses
            every block exactly once; it does not create missing details.
          </span>
        </label>
        <label className="block">
          Itinerary days
          <input
            className="mt-2 block w-full border-b bg-transparent py-3"
            type="number"
            min="1"
            max="30"
            value={days}
            disabled={busy}
            onChange={(e) => {
              setDays(e.target.value);
              setResult("");
            }}
          />
        </label>
        <Button type="button" disabled={busy} onClick={generate}>
          {busy ? "Preparing draft…" : "Generate itinerary quote draft"}
        </Button>
        <p role="status">{message}</p>
        {result && (
          <article className="space-y-5 border-t border-border pt-6">
            <h3 className="text-2xl">Quote draft — staff review required</h3>
            <p>
              Provisional sequence. Check transfers, opening hours, room availability and all
              supplied facts before publishing.
            </p>
            <pre className="whitespace-pre-wrap font-sans">{result}</pre>
            <p>
              Total supplied by staff:{" "}
              {quote.total ? `${quote.currency} ${quote.total}` : "Awaiting verified quote"}
            </p>
            <p>Quote expiry supplied by staff: {quote.valid_until || "To confirm"}</p>
            {(["accommodation", "inclusions", "exclusions", "terms"] as const).map((key) => (
              <div key={key}>
                <h4 className="capitalize">
                  {key === "terms"
                    ? "Payment / deposit / cancellation terms supplied by staff"
                    : key}
                </h4>
                <p className="whitespace-pre-wrap">{quote[key] || "To confirm with Pelican"}</p>
              </div>
            ))}
            <Button
              type="button"
              onClick={() => {
                onApply(result);
                setMessage(
                  "Itinerary applied to the editable proposal. Prices and terms were kept unchanged. Review and publish using the proposal form.",
                );
              }}
            >
              Use itinerary in proposal
            </Button>
          </article>
        )}
      </div>
    </details>
  );
}
