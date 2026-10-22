# Roadmap

- [x] Approve this exact project preview for booking/enquiry submissions and add booking-status links to short-reference emails; existing staff received-payment recording preserved. 27 tests passed; booking form validation and invalid lookup checked in browser, appearance unchanged.
- [ ] Booking operational verification: successful receipt/email delivery and staff payment save/read-back still need a controlled live request and staff MFA session; no real emails or money records changed during this check. Publish to update the live website.

- [x] Switch all three AI features to Lovable AI and remove the unused Google AI Studio secret. Both legacy functions redeployed; all three gateway request shapes returned verified answers; 25 regression tests passed. Website appearance unchanged.
- [ ] Operational AI end-to-end verification: traveller planner is blocked by missing public.consume_traveller_plan_request (PGRST202), and localhost is not in the configured origin allowlist. Private staff flows still require staff plus authenticator verification; no security bypass or unrelated migration applied.

- [ ] Codex migration coordination: blocked on platform Git sync. Commit 468dd49 is not in local history; sender still uses the old domain and VITE_SITE_ORIGIN is absent from .env. Preserve saved Search Console work; do not publish until merged main is loaded. Git sync must be completed through Lovable Git settings, not manual pulls.

- [x] Google Search Console setup complete (22 Oct 2026): property https://pelicantoursandsafari.com/ added and verified (siteOwner), sitemap submitted and registered (pending processing, 0 errors/warnings).

- [x] Update existing managed account email settings and previews for notify.pelicantoursandsafari.com without overwriting branded templates or changing Resend enquiry sending.
- [ ] Activate new managed sender and verify real email delivery. Blocked on DNS verification; current email settings also need publishing.

- [x] Phase 1: edge-to-edge layout, real routes, page shells (Home, Safaris + detail, Destinations + detail, Tailor-Made, About, Gallery, Contact)
- [x] Batch 1: supplied logo and icons, intentional homepage wording, safari finder/comparison, expanded Safari Brief, contextual safari/destination planning.
- [x] Stay V1: four official-source properties, destination/type/collection filters, detail pages and Pelican booking requests; preferred stays/nights included in Safari Brief. Property imagery and expanded verified rates/policies remain pending.
- [x] Journey V1: interactive destination map, local preference saving, editable/reordered stops and nights, related stays/safaris and shareable links. Real driving routes, property pins and feasibility calculations require verified data.
- [x] Local enquiry/admin hardening: validated function submission, SQL migration, RLS, rate limits, idempotency, audit events and conflict-aware staff saves. Local database tests pass; live rollout requires access to Pelican's database and deployment configuration.
- [ ] Verified content: Pelican itineraries, duration, inclusions, prices, seasonal advice, vehicle specifications, guide profiles and genuine guest stories. Blocked on supplied or verified content; do not invent.
- [ ] Later batches: Travel Guide, Field Notes, FAQ, guide/team pages, accessible gallery viewer, route maps and itinerary downloads.
- [x] Enquiry submission live end-to-end (19 Oct 2026): Safari Brief → submit_enquiry RPC (applied via migration) → enquiry row with reference; traveller confirmation + Pelican notification emails wired through Resend (RESENDER_API_KEY). Live delivery to real recipients is pending a domain verified in the Resend dashboard (from-address still on the test sender).
- [ ] Live verification and rollout of enquiry hardening; email notifications/confirmations, content administration and proposals.
- [ ] Future roadmap: availability integrations, deposits/payments, traveller portal, saved journeys, multilingual content and live rates.
- [x] Local property map V2: four operator-sourced lodge/hotel pins, straight-line distances, Google Maps directions and on-demand OpenRouteService road estimates. Server routing deployment/key and coverage verification remain pending.
- [x] Local private trips V1: staff-managed draft/confirmed/cancelled itineraries, traveller assignment and signed-in trip maps. Database migration, real staff/traveller flow and production Auth configuration remain pending.

### Traveller decision and staff follow-up batch — 12 October 2026

Implemented in code: interest-based Safari Match with budget/days/style passed into the brief; device shortlist and share links; source-linked seasonal/travel guidance and pricing explanation; receipt reference and two-business-day response target; authenticated assigned private proposals with immutable quote versions and change requests; staff assignment, follow-up dates, overdue filter, loaded-record search, activity history and older-record loading; verified-content publication/withdrawal interface.

Pending operational activation: apply the new migration in Lovable Cloud and test with real staff/traveller accounts. Supply approved day-by-day itineraries, rates, accommodation photos/rooms/accessibility facts, guides, vehicle specifications, genuine reviews and business credentials. Staff can publish sourced text and a verified photo URL with each entry through the new interface. No scheduled email/SMS reminder service was added. Existing UI design is preserved; new links and separate feature screens reuse its components.

### Lovable AI itinerary quote drafting

Implemented: staff-only in-app draft generation in the existing proposal editor, linked Safari Brief loading, approved/manual tour detail selection, source-bound AI sequencing, quote preview using staff-entered rates and terms, and explicit application of only the itinerary. Server authentication, rate/budget quotas and malformed/invented-output rejection are included. No new provider dependency or public AI endpoint is exposed.

Activation pending: apply `202610120003_ai_itinerary_drafts.sql`, enable the Lovable AI connector/backend secret, deploy `draft-itinerary`, and run a synthetic live smoke test. Existing UI is preserved apart from the requested collapsible staff feature. AI does not invent missing stops, prices, deposits or payment terms; staff must supply the verified itinerary blocks and commercial information.
