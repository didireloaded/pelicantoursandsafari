# Pelican client administration

Six main screens, using Pelican's existing fonts, colours, controls and page shell:

| Screen             | Address         | Purpose                                                                                                                                                                      |
| ------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home               | /admin          | Task links and publishing instructions; no telemetry                                                                                                                         |
| Packages           | /admin/packages | Create package pages, descriptions, destinations, experiences, cover photo, day-by-day itinerary, inclusions/exclusions, seasonal NAD rates and optional sourced conversions |
| Gallery            | /admin/gallery  | Upload photos, destination albums, captions, alternative descriptions and numeric display order                                                                              |
| Enquiries          | /dashboard      | Existing staff inbox, assignment and follow-up tools                                                                                                                         |
| Travel information | /content-manage | Existing verified information and catalogue safari detail editor                                                                                                             |
| Account            | /admin/account  | Authenticator enrollment/challenge, password recovery and sign-out                                                                                                           |

## Update flow

The new package and gallery editors store draft and published snapshots separately. Save draft never changes published data. Preview is private; Publish atomically replaces the public snapshot. Unpublish hides content without deleting history. Recent versions can be loaded into the editor as a draft and published again. Revision checks reject concurrent edits and ambiguous retries; text remains in the form. Unsaved navigation is guarded.

Public packages appear on /safaris and have /packages/{id} pages. The package link carries its reference and selected destinations into Safari Brief; staff receives the package reference in the enquiry message. Existing safari category URLs and their validation remain intact. New package pages have SSR metadata/canonical/schema; /package-sitemap.xml reads the published database rather than requiring a build. Existing static sitemap remains intact; robots advertises both.

Public pages query only the published projection. An open page refetches every 30 seconds and on focus; staff publication invalidates local public queries. New visits read current content. Gallery albums display only published photos. No GitHub push is needed for ordinary content changes.

The older Travel information editor retains its existing immediate approved/draft checkbox behavior; it is not a staged copy of the new editor. Staff should use Packages for new offers. Catalogue categories, destination definitions and accommodation catalogue entries remain developer-managed; verified accommodation facts can still be edited under Travel information.

## Security and storage

The admin route verifies the session and staff role. New content editing requires MFA aal2, enforced both in UI and database functions/RLS. Account creation never grants staff access. Existing enquiry/travel-information tools keep their existing authorization model; this release does not impose MFA on those older endpoints.

Draft/history tables grant staff+aal2 SELECT only; all writes go through the authenticated, revision-checked RPC. The public SECURITY DEFINER RPC exposes only published snapshots. Storage is private with staff+aal2 upload and published-reference-only read policies. There is no file overwrite or delete policy. Photos become WebP, max1920 pixels, in-browser re-encoding removes embedded metadata; input JPEG/PNG/WebP up to12MB, output max5MiB.

Live bucket: site-media, private, 5,242,880-byte cap. Lovable's supported bucket tools could not set allowed_mime_types, so it remains null. The normal UI re-encodes WebP and policies restrict paths; the bucket does not independently verify image encoding. Staff are trusted publishers; do not claim MIME or content scanning. Uploaded paths must exist before saving/publishing. Signed download links request a10minute lifetime; new uploads request a60second cache lifetime. Previously issued URLs, CDN/browser caches or downloaded copies may remain accessible after unpublish; unpublishing is not a recall of existing copies. Unused/replaced uploads are retained privately; no destructive cleanup is automated.

## Activation and operation

Live migration: drizzle/migrations/0003_client_admin_content.sql (applied by Lovable on22October2026). Do not replay another duplicate migration. Bucket must be provisioned using Lovable Storage tools, not INSERT storage.buckets in a Cloud SQL migration. Migration was tested with PostgreSQL/PGlite and anonymous live API reads returned200 with empty arrays. Tables/RPC grants/RLS/private bucket were checked by Lovable.

There were zero staff accounts at activation. The website manager must identify the client's authenticated user ID, verify the intended person, and assign the existing staff role through the trusted database administration process. Do not guess an email or auto-promote the first signup. The client then signs in at /admin, enrolls their authenticator, verifies its code and manages content. Password recovery email and live MFA/upload/publish need a staff-account acceptance test before client handover.

Rollback: redeploy previous app commit if needed. Keep the additive tables/bucket/history; do not drop published content or delete uploads. Unpublish entries through the editor for content correction. Normal database backups must include the new content/history and Storage objects; restoring only SQL does not restore photos.

## Acceptance checks

- PostgreSQL tests: nonstaff/anon writes denied, drafts/history hidden, save vs publish isolation, conflict rejection, history retention, public media access only while published, MFA gate.
- UI tests: save draft/publish actions, revision handoff, failed save retains text, schema validation.
- Existing gallery and Safari Brief tests updated for public content reads.
- Full tests, typecheck, lint and build run before publishing. Live signed-in staff writes remain explicitly unverified until a staff account is designated.

Final verification:175tests passed, TypeScript/build passed, lint0errors/13existingwarnings. Local browser checks confirmed no horizontal overflow at390/1440 for the package/gallery editors using a clearly labelled sample harness outside the app; no auth bypass or mock route was shipped. The actual /admin route redirected unsigned visitors to sign-in. An unknown package returned404, and the live-backed package sitemap returned valid empty XML before any package publication. DeepSeek review: no second EXIF rotation exists; authenticated RPC EXECUTE is intentionally paired with authoritative staff+aal2 checks (tested). Cached-photo persistence is documented and new upload cache lifetime bounded.

## Reference-led workspace (22 October 2026)

Nine sidebar destinations share Pelican's private cream/green/clay shell:
Overview, Clients, Reservations, Analytics, Packages, Gallery, Enquiries, Travel information, Settings.
The public website layout is unchanged. There is no task board or model branding.

Clients are private records (photo or initials, origin country, source, contact details, notes, archive state). Recorded spend sums manually recorded received amounts from their reservations; missing amounts remain “Not recorded”. Reservations extend existing `trips`, retain draft/confirmed/cancelled status and traveller-own visibility, and can belong to offline clients without an account. Staff must verify identity before linking a traveller UUID. Dates use UTC date arithmetic; return day is checkout-exclusive. No live supplier availability or payment collection is implied.

Cloud migration: `drizzle/migrations/0004_private_admin_workspace.sql`. Client writes check revisions; reservation writes check updated_at under transaction locks. New workspace access and existing staff trip policies require staff + aal2. Authenticated users cannot directly write client or financial fields. Existing staff role onboarding remains manual; signups never self-promote.

The staff help panel calls Lovable Gateway server-side after origin, user, staff/MFA and quota checks. It sends approved public company facts and aggregate counts only, never client names, email, notes, photos or individual financial records. It has no action tools or codebase access. Answers require review; it cannot save or send anything. `LOVABLE_API_KEY` stays server-side. Existing draft quota is shared (10/hour/staff, 100/day globally).

Analytics measures aggregate public page views only after deployment, using the existing allowed-origin, trusted Cloudflare ingress and rate salt configuration. GPC/DNT opt-outs are respected; no cookies, identifiers or raw IP are stored. Short-lived salted network hashes rate-limit events; counts exclude excess events and are not unique visitors. No historical traffic is backfilled. Audience means staff-entered client countries; engagement means enquiries per 100 aggregate views, not visitor conversion. Trip value uses confirmed departure dates and recorded agreed totals, not processed payments. Recent staff circles reflect verified staff activity within two minutes.

Rollback: revert the application release using a new Git commit; retain additive database tables/data. Do not drop client records or financial columns to roll back a UI release. Restoring legacy trip policies would reduce MFA protection and needs an explicit security decision.

Verification: 183 automated tests, TypeScript, production build and lint (13 existing warnings, no errors). Browser design checks used explicitly labelled sample records in an external local harness at 1440px and 390px. No sample client records were inserted in production. Live signed-in writes and Gateway response still require the staff member's own authenticator; authentication was not bypassed.

### 22 October usability follow-up

Removed the always-visible technical Help labels. Package editing and enquiries use compact panels; sign-out is available in Settings. Settings hides authenticator setup/code entry for an already verified aal2 session, independently of email confirmation. Themed Radix dropdowns now replace browser menus throughout the app; keyboard selection, empty options, catalogue values and form validation remain supported. Calendar day/event selection opens that day's reservation list and details, and returning to Calendar clears the old day filter. No sample records were seeded.

Help diagnosis: live quota and workspace reads succeeded; exact sandbox HTTP workspace reading/aggregation and a synthetic Lovable Gateway call also succeeded. The original authenticated production failure was not reproduced. Help now uses the shared exact-origin approval helper and reports failures by stage, logging only stage/error name server-side (no questions, rows, secrets or provider response bodies). A workspace failure is no longer reported as quota exhaustion. A fresh signed-in production Help request is still needed to verify the original failure or capture its actual stage. No speculative database changes or security bypasses were introduced.

Verification: 202 tests pass; focused settings, content, planning/currency dropdown and Help error tests; TypeScript and production build pass, lint has no errors (13 existing warnings). Browser design checks at desktop and 390px used the external labelled preview; package controls and reservation populated/empty date selection were exercised.

### Focused enquiry inbox and owner-managed access

Enquiries now separate the list from the selected traveller's details. Search, status and overdue filters share one toolbar; status, assignment and follow-up date sit together. Message, private notes and activity have separate tabs. Notes require an explicit save, survive failed writes and selection/filter changes, and retain the updated_at guard. Refresh keeps unsaved drafts; if saved notes changed, show that version for comparison before the staff member chooses “Save my notes”. History requests ignore stale responses after a selection change. Related trips/proposals/content links remain in a single menu; sign-out stays in Settings.

Cloud migration `drizzle/migrations/0007_owner_managed_team.sql` adds team management to Settings. Only an existing admin-role holder with aal2 can list or change team memberships. Regular staff, visitors, unverified accounts and user-editable metadata cannot grant access. `set_team_member` accepts an existing, uniquely matched, email-confirmed account; it creates no account and sends no invitation email. Share the normal /auth?next=/admin link first, then approve the verified email. For Apple relay accounts use the exact account email in Settings. Existing email/password, Google and Apple providers remain enabled. No provider credentials or MFA settings were changed.

Five distinct team account IDs (admin and staff combined) are allowed. Transaction locks and a user_roles trigger enforce the cap, including role changes; RPCs recheck the administrator after acquiring the lock. Self-removal/change is blocked and a final administrator cannot be removed or demoted through the management functions. Removing staff access leaves their login account and business records intact. Membership comes from database rows, not cached app metadata.

Initial deployment has one existing staff account and zero administrators. No person was granted or upgraded by this release. The first owner must be identified and explicitly authorized once through a trusted operator; public signups cannot claim ownership. Once that owner is established, they approve and remove the other accounts in Settings without routine developer intervention. The owner's reported invalid-credentials failure was observed only as two rejected password attempts; the exact account/sign-in method is still needed for account-specific diagnosis. Password mismatch, account existence, provider identity and staff permissions must not be conflated.

Sign-in presents Google/Apple first, normalizes email without modifying passwords, gives helpful invalid-credentials guidance, and permits existing passwords shorter than the new-signup minimum. Signed-in nonstaff users opening /admin go to Access pending instead of looping through sign-in. Account recovery is initiated only by the user and remains non-enumerating. Email verification and staff MFA remain separate.

### Compact library and enquiry workspace (22 October)

Packages and Gallery now open as a searchable card library (12 entries per page).
Gallery can be filtered by destination. Selecting an entry opens the existing
revision-checked draft/publish editor in a side panel; closing a dirty panel asks
before discarding. No public content or publishing permissions changed.

Enquiries put the traveller message, reply links and editable status first.
Contact information, assignment and follow-up are under an optional disclosure;
activity remains under More details. Explicit note saving and conflict comparison
remain intact. Client details show linked reservations and actual staff-recorded
trip totals/received amounts. Empty amounts are not represented as zero.

Design references: Dribbble customer-inbox search, including Pickolab Studio's
“CRM Dashboard - Inbox Page” and the customer support inbox examples. Adapted
message-first hierarchy and compact browsing to the existing Pelican workspace.
Overview, Analytics and public site styling are unchanged. Traveller-side profile
photo upload and automatic conversion of booking requests into client records
are not implemented by this layout change; staff can already add private photos
and link client reservations through the existing protected tools.
