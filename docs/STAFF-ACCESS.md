# Staff access inventory — 22 October 2026

“Verified staff” here means an authenticated current admin/staff role with an MFA `aal2` session. Email verification alone does not satisfy workspace verification. Page access does not prove email delivery, AI provider availability, or every business action. Sources: route tree, handlers, migrations through 0011, isolated SQL authorization tests, and read-only Lovable production policy/grant audit.

## Every workspace page

| URL                | Verified staff capability                                     | Restrictions                                                |
| ------------------ | ------------------------------------------------------------- | ----------------------------------------------------------- |
| `/admin`           | Overview, aggregate workspace help, recent enquiries          | Help also needs provider/key/quota                          |
| `/admin/clients`   | Read and save client profiles                                 | Revision-checked RPC; no arbitrary direct writes            |
| `/admin/bookings`  | Confirmed booking calendar, reservation details, manual trips | Actual confirmed dates required; optimistic concurrency     |
| `/admin/analytics` | Aggregate traffic, leads and recorded trip value              | Cannot write analytics directly                             |
| `/admin/packages`  | Draft/edit/publish packages                                   | Revision-checked save; public sees published snapshots only |
| `/admin/gallery`   | Upload and manage destination photos                          | Own-prefix private uploads; publish explicitly              |
| `/dashboard`       | Read/update enquiries, confirm booking dates, follow up       | Updated-at conflicts; confirmation requires MFA             |
| `/trips-manage`    | Manage trips and proposals                                    | RPC validation, version/ownership checks                    |
| `/content-manage`  | Manage approved travel information                            | Caller attribution; approved facts only                     |
| `/admin/profile`   | Edit own display name/photo                                   | Own-user RPC, revision and existing own-photo checks        |
| `/admin/staff`     | Read current team names/photos; link to own editor            | No editing another person; removed staff omitted            |
| `/admin/account`   | Account status, authenticator, recovery and sign out          | Own account only                                            |
| `/admin/team`      | Page opens; ordinary staff see administrator restriction      | Roster, grants, approvals/removals require **admin + aal2** |

## Other reachable pages and endpoints

All public pages remain reachable: `/`, `/about`, `/contact`, `/gallery`, `/safaris`, `/safaris/$slug`, `/destinations`, `/destinations/$slug`, `/stay`, `/stay/$slug`, `/packages/$id`, `/journey`, `/match`, `/shortlist`, `/tailor-made`, `/travel-guide`, `/book`, `/booking`, `/auth`, `/reset-password`. Unknown/unpublished package IDs do not expose drafts. `/package-sitemap.xml` contains published packages only.

`/trips` and `/proposals` use session/record authorization; a staff role does not permit impersonating a traveller when submitting change requests. `/access-request` allows an authenticated confirmed account to request access; it does not grant a role. `/.lovable/oauth/consent` is an OAuth consent flow with its own authorization requirements.

Infrastructure routes are not staff pages: `/lovable/email/auth/preview` and `/lovable/email/transactional/preview` require a preview secret; `/lovable/email/auth/webhook` requires a signed provider request. A staff login alone does not authorize these.

## Database functions

| Function(s)                                                                                                                   | Who can use it / effect                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `save_staff_profile`                                                                                                          | Staff + aal2, caller's own name/photo only; revision required                                |
| `staff_directory`                                                                                                             | Staff + aal2 after migration 0011; current role holders only                                 |
| `save_admin_client`, `save_admin_trip`, `save_site_content`                                                                   | Staff + aal2, validated and conflict-checked writes                                          |
| `confirm_booking`                                                                                                             | Staff + aal2; atomic confirmed dates/status, updated-at check                                |
| `touch_staff_presence`, `consume_admin_help`                                                                                  | Staff + aal2; limited presence/help operations                                               |
| `consume_traveller_plan_request`                                                                                              | Signed-in caller; per-user/global planning quota; deployed availability not established here |
| `consume_ai_draft_request`, `publish_proposal`                                                                                | Legacy staff guard; quotas or expected proposal version still required                       |
| `team_members`, `pending_team_requests`, `set_team_member`, `remove_team_member`, `decide_team_request`                       | Admin + aal2 only; five-seat, self/last-admin protections                                    |
| `request_team_access`                                                                                                         | Confirmed signed-in self only; no role self-grant                                            |
| `published_site_content`                                                                                                      | Public, published snapshots only                                                             |
| `has_role`, `is_staff`, `can_manage_site`, `can_manage_team`                                                                  | Boolean authorization helpers; do not grant permissions                                      |
| `valid_trip_stops`                                                                                                            | Pure stop validation helper                                                                  |
| `submit_enquiry`, `lookup_booking`, `assign_booking_ref`, `assign_enquiry_ref`, `record_page_view`, `consume_routing_request` | Service-role only; direct browser RPC denied even to staff                                   |

Trigger helpers (`touch_updated_at`, private audit/date/limit helpers) are database internals, not user actions. The legacy `plan-safari` adapter also references `consume_traveller_plan_request`; it is absent from current generated RPC types, so its deployed availability is **not established** by this audit.

## Server functions / edge handlers

- `requestBooking`, `lookupBooking`, `submitTripEnquiry`, `recordView`: validated public server boundaries; protected service-role RPC behind them. Lookup requires matching booking reference and contact. Submission is not a reservation.
- `askWorkspaceHelp`: staff + aal2, aggregate context, provider/quota requirements.
- `submit-enquiry`: validated origin/rate-limited submission service; not direct table insertion.
- `journey-route`: validated/rate-limited routing service; needs configured routing provider.
- `plan-safari`: signed-in traveller/staff, quota and Lovable provider; deployment/quota function availability not verified here.
- `draft-itinerary`: staff role, quota and Lovable provider; older handler does not independently enforce aal2.
- `deliver-enquiry-emails` and `enquiry-email-webhook`: empty local directories, no tracked handlers. They are **not established callable features** in this checkout. Current app email sending uses the server-side Resend helper; a queued worker/webhook flow must not be assumed deployed.

## MCP tools

`list_safaris` reads the fixed public catalogue. `list_enquiries` and `update_enquiry` require OAuth and use the caller’s database token/RLS; updates require the exact `expected_updated_at`. Real OAuth consent was not retested in this change. `update_enquiry` cannot supply confirmed travel dates, so attempting a new booking confirmation through that tool is blocked by the date trigger; use the dashboard confirmation action.

## Expected RLS / privilege denials

There were **no unexpected missing grants or RLS policies blocking intended staff + aal2 workspace operations** in the live schema audit. Expected denials:

- `staff_profiles` permits staff reads, no direct browser writes. Saves use `save_staff_profile`; another person's profile cannot be changed through it.
- `site-media` is private, 5 MB; verified staff can read, insert only under their own UUID with a `.webp` name. No arbitrary overwrite/delete policy. Public reads are limited to explicitly published content references; staff avatars are not automatically published.
- `site_content`, history, clients, analytics and presence have guarded reads and controlled write functions. History is immutable from the browser.
- `trips` direct insert/update privileges are revoked even where policies exist; use `save_admin_trip`. Deletes have no allowing policy.
- `user_roles`: users read their own roles; cannot self-grant. Team request rows have no direct browser policies; use guarded RPCs.
- Proposal change-request writes require traveller ownership; staff cannot impersonate them. Internal limits/outbox/private-schema data are not browser features.

## Known limitations discovered

1. Legacy enquiry, event, proposal and travel-information policies use `is_staff`, allowing some operations at aal1. Newer private workspace tables require aal2. This is looser enforcement, **not an RLS blocker**; no broad unrelated authorization rewrite was made.
2. Some legacy tables retain broad table grants. RLS still controls row access; grant minimization remains follow-up work. This audit is not a proof that the entire app is vulnerability-free.
3. Storage's allowed MIME list is empty. The app decodes/re-encodes WebP and RLS enforces own-prefix `.webp` paths, but bucket-level MIME enforcement could not be configured with the available Lovable tools. A malicious authorized uploader can bypass client checks. Set allowed MIME to `image/webp` in storage administration.
4. Availability of AI/email/routing providers is separate from database permission success. No customer messages, bookings, roles or other staff profiles were modified for this audit.

## Verification

Isolated SQL tests run actual migrations/policies: own WebP-path insertion → `save_staff_profile` → staff read, nonstaff/aal1/anonymous denial, wrong-prefix rejection, stale revision rejection, direct-write denial, directory MFA and removed-role filtering. UI tests verify saved-name directory rendering and own-only edit link; route tests cover all workspace routes. Live browser upload/save/sidebar evidence is recorded in the release notes when completed; isolated tests alone do not establish live upload success.

### Live walkthrough result

Published application verified on 22 October 2026 with the existing authorized test account (admin + aal2):

1. Used the normal macOS file picker to upload synthetic `/tmp/pelican-staff-flow-test.webp`; the browser extension's direct chooser API lacked file-URL permission, and that permission was left unchanged.
2. UI reported private upload completed; `save_staff_profile` returned confirmed success and the avatar appeared in the sidebar.
3. After publishing the dedicated pages, `/admin/profile` loaded the persisted photo. Saved a temporary display name; sidebar updated immediately.
4. `/admin/staff` loaded the real current roster with the saved name/photo and an edit link only on the caller's card. No RLS error occurred.
5. Restored original display name and removed the test photo association through the same profile save. The synthetic storage object remains private; no delete permission was added merely for test cleanup.

Evidence: `/tmp/pelican-profile-live-photo.png`, `/tmp/pelican-staff-directory-live.png`. No other staff profile, role or customer record was changed. Ordinary-staff versus admin denials were checked in isolated tests/schema inspection; the live browser session itself was an administrator.

Validation: 239 tests across 52 files passed; TypeScript and production build passed. ESLint: no errors, 13 pre-existing warnings. Migration 0011 was applied and read-only verified in Lovable, synced from GitHub, and retested from its exact committed SQL. Application publication reported “Your website was updated.”
