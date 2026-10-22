# Booking requests with trip codes

## What the traveller sees
1. Each safari page shows its trip code (for example "Trip code: ENP1"), styled to match the existing small labels. The look of the page otherwise stays the same.
2. A "Request to book" button opens a short form with the trip pre-filled, plus preferred dates, number of travellers, name, email or phone, and notes.
3. After sending, they see: "Request received. Trip ENP1 · Your reference ENP1-7K3Q", and get the same details by email. The page states clearly that the booking is not confirmed until Pelican sends a written price and terms.
4. A new "Check my booking" page lets them enter their reference and email to see the status: Received → Proposal sent → Confirmed → Cancelled. No account is needed.

Because one code is shared by every traveller on the same trip, each request also gets its own short private reference (the trip code plus 4 characters). Without it, a traveller can't look up their own booking without an account.

## Suggested trip codes (for your approval)
| Trip | Code |
|---|---|
| Etosha Wildlife Safari | ENP1 |
| Windhoek City Tour | WCT1 |
| Namibian Highlights | NHL1 |
| Cross-Border Tours | CBT1 |
| Tailor-made safari | TMS1 |

## What staff see (admin Bookings)
- New requests appear with the trip code and reference, newest first.
- Staff move a request through: Received → Proposal sent → Confirmed or Cancelled, using the existing proposal and payment records. Payments stay recorded by hand (cash or bank transfer).
- Pelican gets an email for every new request at the existing inbox.

## Not included
- No instant confirmation, online payment, prices or availability calendar. Nothing gets invented.

## Technical details
- Trip codes live in the fixed catalogue next to each safari, with a test that every code is unique.
- Requests use the existing enquiry service (validation, rate limiting, duplicate protection, Resend emails). The enquiry record gets new `trip_code` and `booking_ref` columns, added only. The reference is unique and created on the server.
- Look-up goes through a server function that needs both the reference and the matching email or phone, and returns only the trip, the status and the date. Lookups are rate-limited.
- Staff status changes reuse the existing enquiry statuses and the event history. Confirmed bookings connect to the existing trips and proposals.
- Tests: unique codes, reference format, a lookup with the wrong email returns nothing, and the status mapping.
