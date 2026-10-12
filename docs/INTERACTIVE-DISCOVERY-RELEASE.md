# Interactive discovery additions

The user approved adapting Safari Online’s interaction patterns using Pelican’s existing brand, photos, compact image sizes and UI. This batch adds three homepage links (safaris, journey builder and travel calendar), shared desktop background crossfades, subtle contained safari-image zoom and arrow motion, and a travel calendar inside the existing travel guide. The homepage hero and navigation are unchanged.

All panel copy and links are visible without hovering. Keyboard focus selects the desktop background and has an inset focus outline. Phones show individual static photos with ordinary links. CSS transitions and transforms require no-preference for reduced motion; hover effects additionally require a fine pointer with hover support. The pointer handler explicitly ignores non-mouse pointer entry. The optional Strip wrapper clips only its decorative photo; interactive links, comparison controls and their focus rings stay outside it.

The calendar reads its facts from src/lib/pelican.ts. Namibia Tourism Board’s climate page was read on 12 October 2026: summer October–April, winter May–September, short rainy season September–November and main rainy season December–April. Temperature and rainfall guidance remain separate so September correctly shows winter plus short rains. Coastal guidance does not inherit inland heat/rain claims. Botswana/Zimbabwe show the existing regional advice and explicitly require month-specific confirmation. Source: https://visitnamibia.com.na/climate/.

The calendar is general seasonal guidance, never a forecast, live availability or a wildlife guarantee. Only the catalogue destination transfers to the existing Safari Brief; the user chooses exact dates there. No personal data is stored, sent or added to query parameters by these additions. No database migration, API key or backend deployment is needed for these features.

Proof: TypeScript and production build passed; 145 tests across 28 files passed. Lint has no errors and the same 12 existing warnings. Browser checks confirmed background selection by mouse and keyboard, 0-second transitions under reduced motion, calendar anchor navigation, month selection, coastal/regional guidance and Chobe checked in the Safari Brief. Phone (320px), tablet (768px) and desktop checks showed no document overflow; panels measured 256px on phone and 320px on tablet/desktop. The safari image remains inside its overflow-hidden wrapper. Saved screenshots show the new panels and calendar.

DeepSeek reviewed the non-sensitive implementation summary. Its suggestions to filter non-mouse entry, separate rain/temperature ranges and prevent focus clipping were checked: all are already satisfied in this implementation. No speculative changes were made from the review.

Existing backend launch blockers remain separate. A normal Git revert can roll back this presentation-only batch; never rewrite Lovable’s published Git history.
