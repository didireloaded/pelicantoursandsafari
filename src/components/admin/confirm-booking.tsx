import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
type Enquiry = Database["public"]["Tables"]["enquiries"]["Row"];
export function ConfirmBooking({
  enquiry,
  onSaved,
}: {
  enquiry: Enquiry;
  onSaved: (saved: Enquiry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const cache = useQueryClient();
  return (
    <>
      <Button
        onClick={() => {
          setStart(enquiry.confirmed_starts_on ?? "");
          setEnd(enquiry.confirmed_ends_on ?? "");
          setError("");
          setOpen(true);
        }}
      >
        {enquiry.status === "confirmed"
          ? enquiry.confirmed_starts_on
            ? "Change travel dates"
            : "Add to calendar"
          : "Confirm booking"}
      </Button>
      <Sheet
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Confirm booking</SheetTitle>
            <SheetDescription>
              {enquiry.name} · {enquiry.booking_ref}. Choose the agreed travel dates. Saving
              confirms this booking and adds it to Reservations.
            </SheetDescription>
          </SheetHeader>
          <p className="my-5 whitespace-pre-wrap text-xs text-muted-foreground">{enquiry.brief}</p>
          <form
            className="admin-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (lock.current) return;
              lock.current = true;
              setBusy(true);
              setError("");
              try {
                const { data, error } = await supabase
                  .rpc("confirm_booking", {
                    _id: enquiry.id,
                    _updated_at: enquiry.updated_at,
                    _starts_on: start,
                    _ends_on: end,
                  })
                  .abortSignal(AbortSignal.timeout(15000));
                if (error || !data) throw error;
                onSaved(data as unknown as Enquiry);
                await cache.invalidateQueries({ queryKey: ["admin-workspace"] });
                setOpen(false);
              } catch {
                setError(
                  "Confirmation not saved. Your dates are retained. Refresh the enquiry to check for another team member’s changes, then retry.",
                );
              } finally {
                lock.current = false;
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy} className="space-y-5">
              <label>
                Travel start
                <input
                  required
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </label>
              <label>
                Travel end
                <input
                  required
                  type="date"
                  min={start}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Confirm only after availability, price and terms have been agreed. Start and end can
                be the same for a day tour.
              </p>
              <Button type="submit">{busy ? "Saving…" : "Confirm and add to calendar"}</Button>
            </fieldset>
            <p role="alert" className="mt-4 text-sm">
              {error}
            </p>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
