<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Fixed catalogue categories and business facts live in src/lib/pelican.ts. Client-authored packages/photos use site_content draft/published snapshots via src/lib/site-content.ts and site-content-api.ts. Public consumers read only published_site_content; never expose the draft/history tables or replace the fixed catalogue validation with arbitrary client input. New package references travel in Safari Brief text. See docs/CLIENT-ADMIN.md.
- Preserve the existing catalogue-based build-time sitemap generator; use an explicit published-origin fallback when build configuration is absent so previews never become sitemap hosts.
- App enquiry emails (traveller confirmation + Pelican notification) send through Resend via src/lib/email-templates/resend.ts, reading the RESENDER_API_KEY secret (name is intentionally spelled RESENDER as the user saved it); auth/account emails stay on the managed Lovable send helper. The enquiry sender is enquiries@pelicantoursandsafari.com; notifications go to company.email (info@pelicantoursandsafaris.com, the plural mailbox domain is intentional). The new sending domain was fully verified in Resend on 21 October 2026. Never switch to an unverified sender.
- Contact and Safari Brief share the same protected enquiry service and client notification inbox. Email retries use distinct stable provider idempotency keys per receipt and audience; keep rendered payloads deterministic.
- Enquiry submission goes through the submit_enquiry RPC (service role) via src/lib/enquiry-submit.*; the RPC validates shape/lengths, dedupes by request_id and rate-limits by hashed network address; safari slugs are validated app-side against pelican.ts, not hard-coded in the database.
- Auth emails keep all six scaffolded action types and the managed SDK webhook; managed sender lookup and visible From domain must follow the configured Lovable email domain, independently of Resend enquiry sending, so domain changes do not mix the two providers. Shared email branding stays in the email template module so account emails remain consistent.
- Safari discovery uses overview-derived interest labels, never inferred prices, durations or guaranteed inclusions, so filters do not create unsupported packages.
- Tailor-made planning context travels in validated route search parameters; brief details remain in React state until the traveller explicitly opens WhatsApp or email, avoiding silent storage of personal data.

## User preference: preserve the UI

- Work on Pelican here in Codex. Scope is adding requested features and fixing issues.
- Never redesign or restyle the existing UI. Preserve its logo, palette, typography, spacing, layout, imagery treatment, navigation appearance, component styling, and responsive presentation.
- New feature interfaces must reuse the existing visual language and components without changing existing screens. Feature requests are not permission to redesign.
- Fix behavior and backend logic while preserving appearance. If a necessary fix or feature cannot be completed without altering existing UI, explain the specific change and get explicit user authorization first.
- This preference overrides earlier suggestions in this conversation to adjust the hero, navigation, or page compositions unless the user explicitly authorizes that particular UI change.
- Reusable skill: /Users/visionhaus/.codex/skills/pelican-preserve-ui/SKILL.md.

- Client admin content writes use save_site_content with revision checks and staff+aal2 authorization. Preserve draft/published separation, version history, private site-media storage and published-only reads. The applied Cloud migration is drizzle/migrations/0003_client_admin_content.sql; do not duplicate it under supabase/migrations. Never auto-promote signups or choose a staff email on the client’s behalf.
- Private admin redesign is explicitly authorized (22 October references); keep public website unchanged. Workspace clients, analytics and staff presence use drizzle/migrations/0004_private_admin_workspace.sql; reservations extend trips rather than a second booking table. Preserve revision/updated_at checks, staff+aal2, manually recorded money semantics, private avatars, aggregate-only read-only staff help, GPC/DNT and server-only page-view writes. See docs/ADMIN-REFERENCE-DIRECTION.md and docs/CLIENT-ADMIN.md.
- Admin Help, traveller planning and staff itinerary drafting use server-held LOVABLE_API_KEY through Lovable AI only; preserve the existing model, limits and validation so provider changes do not alter feature behavior.
