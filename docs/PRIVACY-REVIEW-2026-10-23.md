# Privacy data-flow review — 23 October 2026

This is an implementation inventory, not a legal determination or a public privacy notice. Do not add a consent banner solely because page views are counted; determine the legal requirements with Pelican's counsel for the markets served.

- Public page-view events send the path to a server function after the browser checks Global Privacy Control and Do Not Track. The server checks those headers again, requires an approved origin and trusted Cloudflare ingress, and derives a daily salted network hash from the incoming IP address. The database keeps per-path daily counts and short-lived rate-limit hashes; the page-view function deletes hash rows older than two hours. No page-view cookie, raw IP, or unique-person count is stored by this code.
- Enquiry and booking forms submit names, contact details and traveller messages to the protected database, then send confirmations and staff notifications through Resend. The contact page says details are used to respond but does not link to a complete privacy notice. Saved enquiries and email-provider records need an agreed retention and deletion policy.
- Journey stops and saved shortlists use browser localStorage. Authentication uses browser storage; the admin sidebar library also has a preference cookie when that component is used. These are distinct from the aggregate page-view measurement and should be described accurately if a public notice is written.
- The traveller planner sends selected destination, dates, interests and budget to Lovable AI only when Generate is pressed. Its quota ledger stores user ID and timestamp, not the plan or budget.

Before publishing privacy wording, Pelican should confirm the data controller/contact, lawful bases, retention periods, processors and transfer locations, access/deletion request route, and whether any additional scripts or platform telemetry run on the published site. Keep any necessary privacy interface in the established Pelican UI.
