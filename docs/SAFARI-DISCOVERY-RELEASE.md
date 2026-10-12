# Safari discovery and planning additions

Added the requested Safari.com-inspired ideas using Pelican's existing branding and catalogue. Competitor copy, photographs, prices, awards, insurance and response promises were not imported.

## Traveller features

- Homepage experience links with real catalogue counts; URL-based filters can be revisited and shared.
- Safari cards and comparison use approved package duration, inclusions and dated NAD starting rates when present.
- Safari detail pages have section navigation, optional approved day-by-day itineraries, inclusions/exclusions and seasonal rate conditions, relevant accommodation suggestions and an illustrative destination map.
- Road estimates are user-requested, timeout after 15 seconds, and never substitute straight-line distances as road distances. Catalogue order is not an approved route.
- Optional USD/EUR displays require staff-approved sourced conversions checked within seven days. NAD remains the quote currency; conversions are indicative and future/stale conversions are hidden.
- Existing four-step Safari Brief now accepts an editable budget and safari-experience preference. Step jumps and all sending paths validate dates, traveller counts, child ages, duration and budget. Personal information remains unsent React state.
- Factual Pelican guide/contact/transport information, approved review/credential entries and planning steps appear close to enquiries.
- Travel guide can be printed or saved as PDF through the browser; FAQ answers are included in the print copy.

## Staff publishing and activation

Apply `supabase/migrations/20261012075627_approved_safari_packages.sql` after reconciling the existing `travel_details` table with the repository's traveller-workflow migration. It extends the existing approval/RLS workflow; it does not create public write access or insert package facts.

In staff **Approved information**, select category **itinerary**, choose a catalogue safari and enter verified duration/days, inclusions/exclusions and seasonal rates. Publish only after checking the source and all conditions. Optional conversions need a dated source. One published structured package is allowed per safari; drafts may coexist. The existing updated_at condition rejects conflicting edits. Invalid/unsupported JSON is hidden publicly and blocked from accidental overwrite in the editor.

Existing approved review/credential records are reused. No rates, reviews, itinerary schedules or conversion rates were seeded. Until staff publish facts, travellers see the existing catalogue and an explanation of quote factors.

Rollback the interface through a normal revert commit. Preserve the additional database columns/content; unpublish affected entries rather than dropping stored data.

## Proof and limits

139 tests pass, including package parsing, stale/future conversion handling, expired rate suppression, rendered currency switching, staff/public database permissions, publication uniqueness, concurrent edits and brief validation. TypeScript and production build pass; lint has no errors. Local browser checks covered new public surfaces at 320, 768 and 1280px, experience filtering, the reviewed brief's budget/experience, map rendering and section anchors. Existing hero/branding remain intact.

The new live migration, staff editor and real approved-rate display require live verification. Existing backend functions/secrets, staff onboarding and enquiry/email activation remain separate unconfirmed launch work. A code push is not proof of those live services.

## External review checked against implementation

DeepSeek reviewed the feature summary. Currency figures are browsing estimates only, never persisted as proposal or enquiry prices, so quote-rate snapshots are outside this change. The published-package index uses the same approved/non-null predicate as public selection; there cannot be two published packages for the same safari. Each query attempt creates its own timeout signal. Package JSON is validated on staff save and public consumption; the database enforces access, catalogue keys, size and publication uniqueness, while malformed structured facts are never rendered. Brief budget and experience remain bounded free-form preferences in the existing server-validated brief, never financial instructions or authoritative prices. Modern browser AbortSignal support remains the existing application baseline.

Final local road-estimate check displayed the unavailable-service message and re-enabled the calculation button; no successful live routing is claimed. A focused rerun of the six changed test files passed all 39 tests after the shared-hook move. Lint reports 12 existing warnings and no errors.
