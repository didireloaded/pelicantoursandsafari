import { useRef, useState } from "react";
import { useAdminSampleMode } from "@/lib/admin-sample-mode";
import { ArrowUp, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { askWorkspaceHelp } from "@/lib/admin-help.functions";
export function HelpPanel() {
  const sample = useAdminSampleMode();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function ask(text = question) {
    if (sample || lock.current || !text.trim()) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setAnswer("");
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Sign in again to use help.");
      const result = await askWorkspaceHelp({
        data: { question: text.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (result.error) setError(result.error);
      else setAnswer(result.answer ?? "");
    } catch {
      setError("Help could not load. Your records have not changed.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (sample)
    return (
      <section className="admin-panel p-5">
        <h2 className="admin-panel-heading">Workspace help</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Return to live data to ask about real bookings and enquiries.
        </p>
      </section>
    );
  return (
    <section className="admin-panel admin-help">
      <div className="flex items-center gap-2">
        <MessageCircle size={17} className="text-primary" />
        <h2 className="admin-panel-heading">How can I help?</h2>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Ask about your bookings, enquiries or website.
      </p>
      <div className="my-4 flex flex-wrap gap-2">
        {["What needs follow-up?", "How are bookings looking?"].map((q) => (
          <button
            disabled={busy}
            key={q}
            onClick={() => {
              setQuestion(q);
              void ask(q);
            }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs"
          >
            {q}
          </button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void ask();
        }}
      >
        <label className="sr-only" htmlFor="workspace-question">
          Your question
        </label>
        <textarea
          id="workspace-question"
          placeholder="Ask a question…"
          maxLength={1600}
          value={question}
          disabled={busy}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span />
          <button
            aria-label="Ask question"
            disabled={busy || !question.trim()}
            className="rounded-full bg-primary p-2 text-primary-foreground"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </form>
      {busy && (
        <p role="status" className="mt-4 text-xs">
          Checking your records…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-xs">
          {error}
        </p>
      )}
      {answer && (
        <div className="admin-help-answer" role="status">
          {answer}
        </div>
      )}
    </section>
  );
}
