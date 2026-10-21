import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { company } from "@/lib/pelican";
import { enquiryInput } from "@/lib/enquiry-input";
import { submitTripEnquiry } from "@/lib/enquiry-submit.functions";

export function ContactEnquiry() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const lock = useRef(false);
  const pending = useRef<{ fingerprint: string; id: string } | null>(null);
  const field = "mt-2 w-full border-b border-foreground/25 bg-transparent py-3 outline-none focus:border-primary";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || reference) return;
    setError("");
    const body = { name: name.trim(), email: email.trim(), phone: null, residence: null,
      contact_preference: "Email" as const, safari_slug: null, brief: message.trim() };
    const fingerprint = JSON.stringify(body);
    if (!pending.current || pending.current.fingerprint !== fingerprint)
      pending.current = { fingerprint, id: crypto.randomUUID() };
    const parsed = enquiryInput.safeParse({ ...body, request_id: pending.current.id });
    if (!parsed.success) {
      setError("Please enter your name, a valid email address and your enquiry (up to 8,000 characters).");
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const receipt = await submitTripEnquiry({ data: parsed.data, signal: AbortSignal.timeout(60000) });
      if (receipt.reference) setReference(receipt.reference);
      else setError(receipt.error ?? "Receipt unavailable. Please retry the same enquiry.");
    } catch {
      setError("We could not confirm receipt. Your details are still here; retry the same enquiry without creating a duplicate. You can also call or WhatsApp Pelican and mention this attempt.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-10 border-t border-border/70 py-12 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <h2 className="text-3xl font-semibold tracking-tight">Send an enquiry</h2>
        <p className="mt-4 text-muted-foreground">Tell us how we can help. Your enquiry goes to Pelican at <a className="break-all underline" href={`mailto:${company.email}`}>{company.email}</a>.</p>
        <p className="mt-4 text-sm text-muted-foreground">Our target is to reply within two business days, Monday–Friday. An enquiry is not a confirmed booking.</p>
      </div>
      <form onSubmit={submit} aria-label="Contact enquiry" aria-busy={busy} className="lg:col-span-8">
        <fieldset disabled={busy || !!reference} className="grid gap-6 sm:grid-cols-2">
          <legend className="sr-only">Your contact details and enquiry</legend>
          <label>Your name<input className={field} name="name" autoComplete="name" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Email address<input className={field} name="email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="sm:col-span-2">Your enquiry<textarea className={field} name="message" required maxLength={8000} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} /></label>
          <div className="sm:col-span-2"><Button type="submit" size="lg">{reference ? "Enquiry received" : busy ? "Sending…" : "Send enquiry"}</Button></div>
        </fieldset>
        {error && <p role="alert" className="mt-4 text-sm text-primary">{error}</p>}
        <p role="status" className="mt-4 break-words text-sm text-muted-foreground">{reference ? `Thank you — your enquiry is saved. Your reference is ${reference}. Keep it for any follow-up. If you have not heard from us within two business days, call or WhatsApp Pelican with this reference.` : busy ? "Sending your enquiry. Please wait for your reference." : error ? "Receipt has not been confirmed. Keep your details and retry, or call or WhatsApp Pelican." : "Your details are used to respond to your enquiry. Nothing is sent until you choose Send enquiry."}</p>
      </form>
    </div>
  );
}
