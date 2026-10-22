# Booking and wider-site verification — 22 October 2026

## Verified live

- Submitted one clearly labelled synthetic booking request through all three steps on the public website. Reference: ENP1-393D. No real travel or payment requested.
- Resend reported the traveller receipt to the previously supplied test address and the notification to Pelican's established business mailbox as Delivered. Both subjects included ENP1-393D.
- Matching reference + original contact returned the saved request. Wrong contact returned no matching booking and removed the old result.
- Safari Match accepted wildlife, five days and a NAD 25,000 preference and offered catalogue-based recommendations. Its planning link preserved the supplied preferences.
- HTTP smoke check covered 40 URLs: sitemap pages, booking, lookup, contact, journey, authentication and admin entry points. All expected pages returned 200; the intentionally invalid URL returned 404. HTTP success does not establish signed-in page functionality or complete browser interaction coverage.

## Implemented and verified locally

- Explicit Confirm booking action in Enquiries, with deliberate staff approval and the existing updated_at optimistic revision check. Confirmation reads/writes the same enquiry status used by booking lookup.
- Receipt email already contained the private booking reference and lookup URL. Its subject now explicitly says booking request reference.
- Booking response reports whether the traveller email was accepted, failed or had no supplied address. The receipt preserves the reference and gives truthful email guidance without resubmitting a saved request.
- Traveller statuses: Received, Under review, Confirmed; Closed is separate. Removed Proposal sent from booking tracking. Confirmed results state that Pelican has confirmed the booking.
- Reservations links to Enquiries for accepting website requests. Calendar reservations are a separate staff-maintained record; no automatic matching by traveller email, payments or trip title is introduced.
- Database integration test executes the actual submission, reference and lookup SQL. It proves deduplication, stable private reference, matching-contact privacy, unauthorized-write denial, staff confirmation, stale-write rejection and confirmed lookup. The isolated test uses the core staff policy; existing MFA/team tests separately cover MFA and role controls.
- Final full automated suite: 224 tests in 48 files pass. Includes all admin route matching, enquiry/booking submission, permissions, authentication/recovery, content draft/publish, proposals, journeys, maps, saved choices, SEO and email boundary tests. TypeScript and production build pass. Lint has 0 errors and 13 existing warnings.

## Limits and remaining work

- No signed-in production staff session was available. A live staff click to confirm ENP1-393D and subsequent public Confirmed lookup are still unverified. No real customer booking was altered and no roles, passwords or MFA settings were changed.
- The Lovable database connector rejected the read-only query because its existing authorization lacks projects:write. No permissions were expanded to get around that restriction.
- A delivered email is provider delivery evidence, not proof it appeared in the primary inbox.
- Email sending remains best effort. Durable queued retries/delivery tracking are not established by this change; the pre-existing untracked email-outbox migration was not staged or applied.
- Live AI, signed-in proposals/trips, admin content writes/uploads, staff management and recovery emails were not exercised end to end in production. Tests cover their code boundaries but cannot establish live provider configuration.
- No exhaustive every-component/all-device or performance certification is claimed. A complete mobile/assistive-technology matrix, live external providers and business acceptance remain launch checks.
- Calendar reservations do not automatically synchronize status to website booking requests. Staff must confirm the booking reference under Enquiries. Traveller profile uploads and automatic conversion into client records remain outstanding from prior work.
