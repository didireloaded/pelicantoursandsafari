# Pelican enquiry core rollout

The code is prepared locally. The connected Supabase account does not currently include project `owwkanlnxtvzwbpggmgf`; no live schema changes or Edge Function deployment have been performed.

Before rollout, obtain access to the actual Pelican database and inspect its schema, existing grants, policies and triggers. Back up the database and test the migration against a staging copy first. The migration retains enquiries and staff assignments but replaces their legacy access policies. Preserve an export of the original policies for rollback.

Apply `migrations/202610080001_enquiry_core.sql` to staging, then deploy `submit-enquiry`. Set server-only secrets `ENQUIRY_ALLOWED_ORIGINS` (comma-separated exact website/preview origins) and `ENQUIRY_RATE_SALT` (a random secret). Supabase supplies the database URL and service-role key. Never put these secrets in Vite variables or Git.

The anonymous function endpoint uses database validation and a per-network limit of ten new enquiries per hour. Verify which forwarding header is set and sanitized by the production gateway before enabling submissions; spoofable client forwarding headers must not determine the limit. Test allowed/disallowed origins, oversized/malformed payloads, concurrent retries, staff-only reads and updates, and a genuine staging submission. The request ID prevents duplicates on retries of the same payload.

Deploy frontend and function together. This frontend uses the function instead of anonymous direct inserts; publishing it without the function will make direct submission unavailable. WhatsApp and email preparation remain available.

Staff must be assigned `admin` or `staff` in `user_roles` by an authorized administrator through server-side access. Signed-in users cannot grant themselves staff privileges. Staff can read enquiries and change only status and notes. Updates use the previous `updated_at` value to reject conflicting edits, and status/notes changes produce audit records.

Confirm signup restrictions and MFA in the real project's Auth settings before staff launch. Existing auth UI is preserved. Automatic email notifications are not enabled: they require a configured sender/provider and a separate reliable delivery workflow.

Marketing stay data remains in the existing central content file. Rates, property photographs and booking engines are not fabricated. Operator pages are linked for current official information; all initial properties use Pelican request booking. Map pins are approximate destination areas, not property coordinates, and dashed lines are not driving routes. Review OpenStreetMap's tile-use policy before a high-traffic public launch; no bulk downloads or offline tile caching are implemented.
