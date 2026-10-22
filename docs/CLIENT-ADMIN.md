# Pelican client administration

Six main screens, using Pelican's existing fonts, colours, controls and page shell:

| Screen | Address | Purpose |
| --- | --- | --- |
| Home | /admin | Task links and publishing instructions; no telemetry |
| Packages | /admin/packages | Create package pages, descriptions, destinations, experiences, cover photo, day-by-day itinerary, inclusions/exclusions, seasonal NAD rates and optional sourced conversions |
| Gallery | /admin/gallery | Upload photos, destination albums, captions, alternative descriptions and numeric display order |
| Enquiries | /dashboard | Existing staff inbox, assignment and follow-up tools |
| Travel information | /content-manage | Existing verified information and catalogue safari detail editor |
| Account | /admin/account | Authenticator enrollment/challenge, password recovery and sign-out |

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
