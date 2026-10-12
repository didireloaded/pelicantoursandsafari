# Pelican enquiry core rollout

The code is prepared locally. The connected Supabase account does not currently include project `owwkanlnxtvzwbpggmgf`; no live schema changes or Edge Function deployment have been performed.

Before rollout, obtain access to the actual Pelican database and inspect its schema, existing grants, policies and triggers. Back up the database and test the migration against a staging copy first. The migration retains enquiries and staff assignments but replaces their legacy access policies. Preserve an export of the original policies for rollback.

Apply `migrations/202610080001_enquiry_core.sql` to staging, then deploy `submit-enquiry`. Set server-only secrets `ENQUIRY_ALLOWED_ORIGINS` (comma-separated exact website/preview origins) and `ENQUIRY_RATE_SALT` (a random secret). Supabase supplies the database URL and service-role key. Never put these secrets in Vite variables or Git.

The anonymous function endpoint uses database validation and a per-network limit of ten new enquiries per hour. Verify which forwarding header is set and sanitized by the production gateway before enabling submissions; spoofable client forwarding headers must not determine the limit. Test allowed/disallowed origins, oversized/malformed payloads, concurrent retries, staff-only reads and updates, and a genuine staging submission. The request ID prevents duplicates on retries of the same payload.

Deploy frontend and function together. This frontend uses the function instead of anonymous direct inserts; publishing it without the function will make direct submission unavailable. WhatsApp and email preparation remain available.

Staff must be assigned `admin` or `staff` in `user_roles` by an authorized administrator through server-side access. Signed-in users cannot grant themselves staff privileges. Staff can read enquiries and change only status and notes. Updates use the previous `updated_at` value to reject conflicting edits, and status/notes changes produce audit records.

Confirm signup restrictions and MFA in the real project's Auth settings before staff launch. Existing auth UI is preserved. Automatic email notifications are not enabled: they require a configured sender/provider and a separate reliable delivery workflow.

Marketing stay data remains in the existing central content file. Rates, property photographs and booking engines are not fabricated. Operator pages are linked for current official information; all initial properties use Pelican request booking. Map pins are approximate destination areas, not property coordinates, and dashed lines are not driving routes. Review OpenStreetMap's tile-use policy before a high-traffic public launch; no bulk downloads or offline tile caching are implemented.

## Property maps and private trips (12 October 2026)

Apply `202610120001_trip_maps.sql` after the enquiry migration in staging before publishing the new trip pages. Deploy `journey-route` including its `_shared/journey-locations.ts` import, and set `OPENROUTESERVICE_API_KEY` as a server-only Lovable Cloud secret. It reuses `ENQUIRY_ALLOWED_ORIGINS` and `ENQUIRY_RATE_SALT`. Verify the gateway forwarding header as described above. Set provider account quotas/alerts; twenty route calculations per network per hour is an application limit, not a global provider spending cap. Requests send only known catalogue coordinates and are initiated explicitly by the user. Unavailable routing falls back to labelled straight-line distance and external Google Maps directions, never fabricated driving times.

Verify OpenRouteService coverage/access roads for each property in staging using the real key. Returned paths are estimates; park restrictions, gravel roads, border crossings, stopping time and traffic still need Pelican review. Property coordinate source URLs and verification dates are held alongside the shared map catalogue. Destination points are approximate regions; they must not be presented as exact lodging locations.

Travellers create/confirm their account at `/auth?next=/trips`, then share their account UUID with Pelican. Staff create the itinerary at `/trips-manage` and assign that UUID. Staff verify supplier confirmations before publishing a trip as confirmed. Drafts are staff-only; confirmed/cancelled records are readable only by their assigned traveller and staff, with no public reads or traveller writes. No personal trip contents are placed in shareable journey URLs or local storage. Enquiry status does not automatically create a confirmed booking. This release handles only the four catalogue properties and destination stops, not supplier inventory or reservations.

Configure the production `/trips` Auth redirect URL and email confirmation delivery. Test two traveller accounts plus a staff account: each traveller must see only their own confirmed/cancelled trips, and edits must reject stale `updated_at` values. Back up before migration; rollback the frontend first, retain trip data and revoke the new policies/grants rather than dropping records.

## Traveller decision and proposal workflows (12 October 2026)

Apply `202610120002_traveller_workflows.sql` **after** the enquiry core migration and before releasing this frontend. It adds staff-only enquiry assignment/follow-up and audit columns, a staff directory RPC, private proposals with immutable published versions, bounded traveller change requests, and source-attributed approved content. No content or staff role is seeded.

- Assign staff roles through the existing controlled administrator process. Assignment accepts only staff users.
- Ensure auth redirect allowlists include the deployed `/proposals` route. Travellers register/sign in and give Pelican their account ID; staff creates a proposal for that account. A copied proposal URL requires that account to sign in; the URL alone does not grant access.
- Staff publishes the full itinerary, accommodation, total/currency, inclusions, exclusions, expiry and terms. Versions cannot be edited or deleted by application roles. A replacement version requires the current version number, preventing stale overwrites.
- Staff uses `/content-manage` for verified itineraries, pricing, accommodation, guide/vehicle facts, genuine reviews and credentials. Drafts remain private; published entries can be withdrawn. Preserve source evidence and obtain any necessary permissions for reviews/photos. The public guide shows only approved entries; no invented rates, profiles, testimonials or package details ship with this release.
- Follow-up reminders are dashboard dates/overdue filters, **not scheduled emails or SMS**. Pelican must monitor this queue. The displayed two-business-day response target is a recommendation, not a delivery guarantee.
- Quiz and shortlist work without a database. Device storage contains only catalogue choices. Shared links contain those choices or nonpersonal planning preferences; personal contact information stays in the unsent brief.

Staging checks: register two different traveller accounts and one staff account; verify proposals cannot be read across accounts, expired versions remain labelled, stale publication is rejected, change requests appear for staff, drafts stay hidden from anonymous readers, withdrawal takes effect, assignment/follow-up updates create audit events, and older enquiries can be loaded. Check the existing enquiry edge deployment before testing receipt references.

These changes have local database tests, but the migration has **not been applied to the connected live backend by Codex**. Pushing GitHub alone does not run this migration or grant the required cloud write access. Take a database backup before applying; for rollback, revert the frontend commit and retain the additive tables/audit data. Do not drop proposals to undo a release.

## Lovable AI itinerary quote drafts

Apply `202610120003_ai_itinerary_drafts.sql` after enquiry core. Deploy `draft-itinerary` with the committed function configuration. Enable the project's built-in **AI** connector in Lovable Cloud so Lovable supplies `LOVABLE_API_KEY` as a backend secret; do not put this key in Vite variables, source code or chat. Reuse `ENQUIRY_ALLOWED_ORIGINS` for deployed/preview origins. The function uses Cloud's `SUPABASE_URL` and `SUPABASE_ANON_KEY`, validates the signed-in session with `auth.getUser`, then requires `is_staff` before any model call.

The feature is a collapsible addition to the staff proposal editor. Staff can load its linked Safari Brief, select approved itinerary content or enter verified blocks, and generate a provisional day-by-day sequence using `google/gemini-3.8-flash` through `https://ai.gateway.lovable.dev/v1/chat/completions`. This exact nondeprecated model was verified against the live Lovable gateway catalogue during implementation.

**Commercial safety:** model output is limited to arrays of supplied detail IDs. The server rejects missing/repeated/unknown IDs, extra fields, wrong day counts and truncated responses, and compiles only the original staff-supplied text. Quote amounts, currency, accommodation, inclusions/exclusions and payment/deposit/cancellation terms come from the existing staff fields, never from generated prose. Missing rates and terms stay unconfirmed. Applying a draft changes only the editable itinerary; publishing still uses the existing explicit, immutable proposal-version workflow. Staff must check sequence feasibility and supplier availability.

Only trip-preference text and selected details are submitted to Lovable AI when staff clicks Generate. Labelled contact and accessibility fields from the existing Safari Brief are removed, along with email addresses. This is **not comprehensive personal-data detection**: staff must review the provided text and remove private identifiers/health information before submitting. No brief or generated result is retained in the quota ledger; drafts remain component state until explicitly applied/published.

Requests consume workspace AI credits. The authenticated database quota caps attempts at 10 per staff member per hour and 100 across the team per rolling day, with an advisory lock enforcing concurrent checks. Failed attempts also count. Gateway credit/rate-limit/configuration failures produce actionable messages and never apply a partial draft.

Before enabling production use, test the deployed function with synthetic preferences and verified tour blocks as staff; confirm a traveller account is denied, the commercial fields remain unchanged, and generated itineraries can be edited and explicitly published. Local tests use mocked model responses; no authenticated live generation or connected-cloud deployment was performed by Codex.

## Launch verification update (12 October 2026)

See `../docs/LAUNCH-CHECKLIST.md` for evidence, full feature checks, release order and recovery gates. Live `submit-enquiry` preflight currently returns 404. Lovable SQL inspection still rejects the connector's missing `projects:write` scope; no migration/function activation has been performed by this update.

The MCP `update_enquiry` tool now requires `expected_updated_at`, copied exactly from `list_enquiries`, and rejects stale writes. Refresh MCP clients' tool schemas after deployment and test real OAuth before staff use. Never automatically reload the version and replay a conflicting notes replacement.

Password recovery now has `/reset-password`; add the exact deployed URL to the Auth redirect allowlist and verify delivery and a user-performed reset. This does not configure SMTP, staff accounts or MFA. These must be activated and tested in the real project. GitHub checks compile with placeholder public backend settings and do not deploy Cloud resources.
