# Pelican launch verification

Status: **not cleared for production operation**. A GitHub push/build does not activate Cloud migrations, functions, email, Auth or backups. Keep this document as an evidence ledger; mark a live check passed only with a recorded environment, release, date and result.

## Evidence collected 12 October 2026

- Lovable reports that its Supabase database is enabled.
- Lovable SQL inspection was blocked by the connector's missing `projects:write` scope. The connector advises removing and adding the app again; ordinary reconnect reuses the old scope.
- The Supabase connector exposes another project, not Pelican `owwkanlnxtvzwbpggmgf`.
- A direct public probe of Pelican's `submit-enquiry` endpoint returned **404**. Direct brief submission is not verified operational.
- An anonymous `enquiries?select=id&limit=1` request returned an empty array. No enquiry content was logged. This proves no row was visible in that request, not that populated-row policies, staff access or tenant isolation are correct.
- Local database tests cover request retry deduplication, changed-payload rejection, anonymous/direct-write denial, staff audit history and stale version rejection. Submission handler tests distinguish input errors, rate limits, backend failures and missing receipts.
- MCP updates now require the exact `updated_at` value returned by `list_enquiries`, filter atomically on it, and return the new version. Existing clients must refresh their tool schema. A stale/repeated update must be reviewed after re-reading; clients must not automatically replace the expected version.
- Password recovery code and connection-failure handling exist. Desktop/mobile rendering and missing-session recovery disabling were checked locally. No real recovery email or credential change was performed.
- Route matching tests cover every static route and every current catalogue detail URL. Matching does not prove rendered actions or backend operations.
- GitHub verification runs TypeScript, database/UI/unit tests and a build on main pushes and pull requests. CI uses placeholder public backend settings for compilation; it does not deploy or test the real backend.

## Release order and recovery

1. Restore connector/database access. Identify staging and production explicitly. Export existing schema, grants, policies, triggers, migration ledger and Auth configuration before any changes. Do not use public keys for administrative migration work.
2. Obtain a database backup and restore it into an isolated staging project. Record backup date, retention, encryption/access, restore duration and row-count/audit checks. Confirm the production plan's actual backup/PITR support; do not assume it exists. Set retention and backup-failure alerts with a named Pelican operator.
3. Review existing schema compatibility. Apply migrations in order: `202610080001_enquiry_core.sql`, `202610120001_trip_maps.sql`, `202610120002_traveller_workflows.sql`, `202610120003_ai_itinerary_drafts.sql`. The first migration replaces legacy policies; verify staging exports before applying it. Preserve all existing enquiries/roles/content.
4. Deploy `submit-enquiry`, `journey-route`, `draft-itinerary` and their shared imports to staging. Set server-only origins, rate salt, routing and Lovable AI secrets as described in `supabase/DEPLOYMENT.md`. Confirm the production gateway sanitizes the forwarding address used for rate limits. Provider keys stay out of Git and Vite settings.
5. Configure exact Auth redirects, including `/reset-password`, `/trips`, `/proposals` and OAuth consent; test confirmation and recovery delivery. Assign approved staff accounts through controlled admin access. Confirm ordinary signup cannot create a staff role.
6. Enroll and verify staff MFA with the users present, test sign-in/challenge/recovery, then enforce AAL2 in the backend staff authorization boundary. Browser challenge alone is insufficient. Do not enable enforcement before enrollment and a tested administrator recovery procedure. MFA enrollment/challenge and enforcement remain outstanding in this release.
7. Complete email implementation with the chosen provider, verified sender and authorized staff recipients. Use an outbox written in the enquiry transaction, unique per-enquiry notification keys, leased workers, bounded retry/backoff, stable provider idempotency keys and signed webhook delivery tracking. An accepted API call is not proof of mailbox delivery. Avoid brief contents in staff email; link to the protected dashboard. Do not retrospectively email existing enquiries. The outbox/worker/webhook are not yet implemented or deployed.
8. Run the staging checks below, then apply the same inspected release/configuration to production. Smoke-test the production build only after backend compatibility is confirmed. Record commit, migration ledger and function versions.
9. For rollback, revert the frontend with a new Git commit (never force-push), restore the previous compatible functions/configuration, and retain additive tables/audit history. Do not drop data to undo a release. Restore a database backup only for a verified data incident under a controlled downtime/reconciliation plan; reconcile enquiries accepted since that backup.

## Core path: required live proof

Use a dedicated staging traveller inbox and authorized staff test accounts. Do not send test messages to arbitrary public/company addresses. Record only references and redacted evidence, never brief contents, tokens, passwords or email addresses in logs.

| Check | Required result | Live status |
| --- | --- | --- |
| Choose safari and stay | Correct catalogue choices transfer into journey/brief; prices and availability are not invented | Pending |
| Build journey | Add/remove/reorder stops, nights and lodging survive reload; only nonpersonal choices are stored | Pending |
| Share across devices | Shared link opens equivalent choices in another browser/device; no personal brief data in URL | Pending |
| Submit brief | One saved enquiry and visible reference; request is clearly distinguished from a reservation | Blocked: function 404 |
| Retry/response loss | Concurrent identical request IDs return one reference and one row; changed payload with same ID rejected; no duplicate email jobs | Pending |
| Traveller confirmation | Correct reference, target response time and next steps; no confirmation of a reservation; delivery verified in authorized inbox | Blocked: email workflow absent |
| Staff alert | Authorized staff receive dashboard link; anonymous visitor cannot use that link to read an enquiry | Blocked: email workflow absent |
| Staff sees/updates enquiry | Correct brief and choices; stage, notes, assignment and follow-up persist after reload/new session | Blocked: staff accounts/access unavailable |
| Conflict | Two staff clients read same version; first edit persists, stale dashboard and MCP edits fail without overwriting; audit contains winning changes | Local proof; live pending |
| Privacy | Anonymous, ordinary signed-in and revoked staff users cannot read or update populated enquiries; travellers cannot see another account's trips/proposals | Local proof; live pending |
| Expired session | Saves fail clearly, unsaved edits are not falsely acknowledged, sign-in recovery works | Pending |
| MCP OAuth | Actual authorize/deny, issuer/audience verification, invalid/expired token denial, staff role revocation and stale-update protection | Pending |

## Every existing feature

Repeat on desktop and mobile (390px viewport plus at least one real mobile device). Check keyboard navigation, labels/focus, errors and success feedback. Preserve the existing visual presentation.

- `/`, `/about`, `/contact`, `/gallery`: navigation/footer/mobile menu, image loading, phone/email/WhatsApp destinations, external links and any displayed CTA. Contact links prepare an external action; they do not imply a message was sent.
- `/safaris`, all `/safaris/:slug`, `/destinations`, all `/destinations/:slug`: search/filter combinations, no-result state, comparison, details, shortlist and brief transfer.
- `/stay`, all `/stay/:slug`: destination/type/amenity filters, source links, request flow, shortlist, property map locations; no supplier reservation claim.
- `/journey`: restore/clear preferences, invalid share URLs, add/remove/reorder/nights/property selections, distances and selected-provider routing. Block tiles/routing/network and confirm labelled straight-line/external directions fallback without fabricated driving times.
- `/match`, `/shortlist`: valid recommendations from the real catalogue, reload, private browsing/storage denial, share import, remove/clear, duplicate choices and transfer. Verify both device-local choices and shared link behavior without promising automatic account sync.
- `/tailor-made`: required/invalid fields, back/next/review, selected safari/journey/quiz context, double clicks, offline/server outage, same-ID retry, changed brief retry and receipt. Confirm phone-only enquiries do not promise an email confirmation.
- `/auth`, `/reset-password`: sign-in/signup errors, email confirmation, generic recovery request response, expired/single-use recovery link, failed update, successful user-performed password reset, safe return URL and MFA path once implemented.
- `/dashboard`: role denial, loading failures, all stages, notes, staff assignment, follow-up/overdue, search and older-page loading, stale edits, audit history, sign out and expired-session save.
- `/trips-manage`, `/trips`: draft privacy, confirmed/cancelled visibility, correct account assignment, stale edits and maps with routing unavailable. A brief or enquiry stage does not automatically create a reservation.
- `/content-manage`, `/travel-guide`: unpublished content privacy, approved sources, publication/withdrawal, stale edits and bad images; no fabricated itinerary/rate/profile/review data.
- `/proposals`: account isolation, preserved deep link through sign-in, immutable published versions, concurrent publish conflict, expiry labels, traveller change requests and failed saves. AI drafts use only supplied detail text; prices and deposit terms remain staff-owned. Test timeout, quota/auth/provider errors and invalid model output before applying.
- `/.lovable/oauth/consent`: missing/expired authorization, approve/deny, provider errors/offline, double clicks and safe issuer-issued redirects. Verify actual external MCP client behavior, not just page rendering.
- Unknown catalogue slugs/routes: clear not-found behavior and working return navigation.

## Monitoring and operation gates

These are setup requirements, not claims that alerts/backups are configured.

- Assign an operator and incident contact. Configure frontend/function error reporting with PII, request bodies, tokens and query values redacted; include release and safe error category. Distinguish invalid input/rate limits from service outages.
- Configure independent uptime checks for the published site, enquiry endpoint preflight and a non-production synthetic core path. Do not continuously insert real production enquiries or send traveller emails as a health check. Alert the authorized operator on consecutive failures and recovery.
- Track pending/failed notification age, provider delivery/bounces, enquiry save errors, Auth failures, routing/AI quotas and database resource/backup failures. Confirm alerts arrive at an approved destination and alert thresholds avoid rate-limit noise.
- Document provider plan limits, secret rotation, staff offboarding, backup restoration, incident triage and the tested revert procedure. Perform a recovery drill in staging and record achievable recovery point/time before promising a service level.

Launch is cleared only when the core path and advertised actions have live evidence, notification delivery works, staff MFA/roles are enforced, and recovery/alerts have been exercised. Local tests alone do not clear these gates.
