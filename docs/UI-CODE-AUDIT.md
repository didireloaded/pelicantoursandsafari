# UI and code audit — 21 October 2026

Existing Pelican styling, photography, navigation and page compositions were retained. The requested Contact form is the only new public interface; it reuses existing controls and the protected enquiry service. No feature was removed merely because it needs signed-in access or approved content.

## Changes

- Contact accepts a required name, email and enquiry; trims/validates with the shared enquiry schema, submits through the same service-only RPC as the Safari Brief, and shows a saved reference only after database acknowledgement. Notifications go to the owner mailbox, info@pelicantoursandsafari.com.
- Pending submissions lock against double clicks. Failed attempts keep fields and reuse the same UUID; editing the enquiry creates a new UUID. Failure never displays success. The Contact and Safari Brief timeouts allow the existing database and email-call budgets.
- Resend uses distinct deterministic idempotency keys for traveller and staff messages, based on the database reference. Actual rendered payload stability is tested. This prevents duplicate provider sends during its 24-hour idempotency window; it is not a durable delivery queue or a guarantee of inbox receipt.
- Staff and proposal sign-in checks reuse the existing bounded session verifier and pending state. Staff redirects preserve the requested page instead of always returning to the dashboard. Staff roles and database authorization are unchanged.
- Map copy correctly discloses either configured routing provider and attributes the returned provider. Missing titles on Travel Guide, Safari Match and Shortlist are supplied.
- Five existing lint errors in managed email scaffolding were fixed with typed preview factories and unknown property bags. All six account-email previews still render. Thirteen existing warnings remain, mainly scaffold fast-refresh exports and hook dependency declarations.
- `npm run preview` now uses Nitro's native preview command for the Cloudflare build. The former Vite command looked for a nonexistent dist/server/server.js. Nitro starts Wrangler against the built worker; use its printed local URL.

## Proof

- All 31 public/catalogue pages visited at 320, 390 and 1440 pixels; no page-wide horizontal overflow or missing main headings. Desktop sweep found no empty internal links. Contact additionally checked at 768 pixels; fields remain inside their columns.
- Public coverage: Home, About, Contact, Gallery; safari listing and all four safari pages; destination listing and all eleven destination pages; Stay and all four accommodation pages; Journey, Safari Match, Shortlist, Safari Brief and Travel Guide.
- Browser interactions: mobile menu opens/navigates/closes; safari experience filter narrows results; selected safari transfers to the brief; journey stops add/reorder/transfer with their order intact. Five private pages redirect unauthenticated visitors to sign-in and preserve the destination.
- Contact component tests cover required fields, strict input, destination inbox, acknowledged receipt, failure retention, duplicate-click lock, UUID reuse and new UUID after editing. Local browser submission safely rejected the unapproved local origin, retained fields and showed no receipt; no database write or real email was attempted through that rejected path.
- All 162 tests pass, TypeScript passes, production build passes. ESLint: zero errors, thirteen warnings.
- Built Cloudflare app opened through Nitro/ Wrangler preview. Homepage canonical matches https://pelicantoursandsafari.com/ and new Contact form renders. Observed homepage resource responses had no HTTP errors; AVIF imagery loaded and Leaflet was not loaded on Home.
- Existing responsive AVIF/WebP sources, lazy below-fold images, prioritized hero imagery, fixed image dimensions, self-hosted/preloaded font and route splitting remain. No dependencies were added. Local checks are not a real-world Core Web Vitals score.
- DeepSeek review was checked against source: rendered retry payloads are stable; no automatic Resend retry loop exists. Suggested hypothetical nondeterminism/retry delays were not present.

## Live checks still required

Actual client/traveller inbox receipt, signup/recovery email round trips, signed-in staff mutations, private proposals/trips, live routing and AI-provider responses were not executed in this audit. Database permission and workflow tests are not a substitute for those authenticated live checks. Email failures remain best-effort after the enquiry is stored. The small orange-label contrast issue remains recorded as previously requested; its colour was not changed.
