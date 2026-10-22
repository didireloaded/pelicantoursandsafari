# Confirmed calendar — live verification, 22 October 2026

The requested screen already exists at `/admin/bookings`, using `ReservationCalendar`, `reservationEvents`, and enquiry date fields from `0010_confirmed_booking_calendar.sql`. Reused it without changing the public or admin design.

## Staff flow

1. Open Enquiries and choose a booking request.
2. Choose **Confirm booking**, enter agreed Travel start and Travel end, then **Confirm and add to calendar**. Status and dates save atomically through `confirm_booking`; a separate “scheduled” status is unnecessary.
3. Open Reservations. The confirmed traveller appears on every day in the inclusive date range. Select their name to see reference, dates, safari and contact details.
4. Use **Change travel dates** in Enquiries to reschedule. Previously confirmed requests without dates offer **Add to calendar**. Undated legacy confirmations remain flagged, rather than receiving guessed travel dates.

## Live proof

Created one clearly labelled synthetic enquiry, **TEST Calendar Walkthrough**, reference **ENP1-R46R**, through the public booking form using the existing authorized test contact. This was explicitly marked as no actual travel/payment/availability hold; no real traveller was modified.

- Confirmed via staff `confirm_booking` with dates **2026-10-26–2026-10-28**; response HTTP 200 and dashboard confirmed success.
- Calendar showed the same reference on 26, 27 and 28 October. Clicking the 27th opened the correct booking details and date range.
- Rescheduled the same enquiry to **2026-10-29–2026-10-30**. Old calendar entries disappeared; new dates appeared and persisted after fresh navigation/data loading.
- Synthetic request closed after proof so it does not remain a real upcoming departure. Retained for audit, not deleted.

Initial automation `.fill()` did not commit native date changes to React state. This produced a safe failed save; native arrow-key date edits committed the inputs and the save succeeded. No database/auth changes or validation bypass was needed. Temporary native DevTools diagnostics were closed afterward.

Evidence screenshots: `/tmp/pelican-confirmed-calendar-before.png`, `/tmp/pelican-confirmed-calendar-after.png` (captured before closing test).

## Regression proof

`booking-confirmation-database.test.ts` runs the actual confirmation SQL and tests staff/MFA guards, invalid dates, stale writes, contact-matched status, persisted calendar projection, rescheduling and preservation of a single enquiry row. `reservation-calendar.test.tsx` checks confirmed-only rendering, day expansion/selection and rerendered dates removing the old entry.

Four focused tests passed; TypeScript passed. Only tests and this evidence document changed in this verification pass; existing calendar application code was already deployed.
