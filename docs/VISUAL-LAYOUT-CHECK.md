# Visual layout check — 12 October 2026

The user authorized smaller images, aligned text and spacing corrections across the website. Branding, palette, Sora and the original photographs remain.

## Changes

- Bound the tall homepage destination photograph to 224px on phones and 320px on desktop, rather than stretching to the destination list height (725px at the original 1280px viewport).
- Reduced homepage, safari and gallery image heights; paired gallery cells have equal heights within each row.
- Reduced and bounded homepage/interior headline scales, with shrinkable photo strips. Interior strips are capped at 512px wide. Adjusted the hyena crop to keep its face visible.
- Explicitly hide picture sources so display:contents does not introduce invisible flex-gap cells; constrain the actual image to its available width.
- Let buttons and section headings wrap, align destination names/countries, wrap long text, and stack footer/CTA columns earlier.

## Verification

Local browser checks covered 32 distinct public/catalogue routes: home, gallery, destinations and all 11 destination details, safaris and all 4 safari details, stay and all 4 stay details, about, contact, tailor-made, journey, match, shortlist, travel-guide, auth and reset-password.

No document horizontal overflow at 320px and 1440px. Public top-level routes also checked at 360px and 768px. Home, contact and long destination/safari titles additionally checked at 834px, 1024px and 1180px. Rendered catalogue images were no taller than 320px in the checked states. Screenshots reviewed at phone, tablet and desktop sizes, including the homepage destination section and gallery animal crops.

TypeScript, production build and lint completed (lint: no errors; existing warnings remain). DeepSeek reviewed the change summary; crop and intermediate breakpoint suggestions were verified, and long-text wrapping was scoped to text elements.

This is local visual verification. Signed-in staff/private pages, dynamically approved travel content and live backend/deployment operation were not verified. The previously declined orange small-text contrast correction remains outstanding; its colour is preserved.
