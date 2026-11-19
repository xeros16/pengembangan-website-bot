# PIR Visuals v5.37.0 — Corporate Website Guide

## Public routes
- `/` — corporate homepage
- `/discover` — searchable designer directory
- `/favorites` — locally saved favorites for this browser
- `/about` — platform overview
- `/how-it-works` — client/designer workflow
- `/contact` — guidance for clients and designers
- `/privacy` — privacy summary draft
- `/terms` — terms of use draft
- `/studio` — Designer Studio login
- `/studio/forgot` — designer password reset

## Important product boundary
PIR Visuals is a portfolio and discovery platform. Clients contact designers directly. The platform does not handle checkout, client payments, escrow, or order mediation.

## Before public launch
1. Review and customize `/privacy` and `/terms` to match actual data collection, hosting, retention, and legal entity details.
2. Confirm the public domain and `PORTFOLIO_PUBLIC_BASE_URL`.
3. Test every navigation link and the designer login/reset routes.
4. Confirm featured designers are genuinely eligible to be highlighted.
5. Review published portfolio media and ensure usage rights.
6. Test desktop, tablet and mobile widths using real browsers.
7. Verify sitemap and robots routes.

## Update on Windows
1. Back up the current source and `portfolio-website/.env`.
2. Stop the website process (the WhatsApp bot and Game Center do not need to be stopped for a website-only source update).
3. Extract the release into a new folder and copy the website `.env`.
4. Run `npm install` in `portfolio-website`.
5. Run `npm run check` and `npm test`.
6. Start the website and inspect `/`, `/discover`, `/favorites`, `/about`, `/privacy`, `/terms`, `/studio` and `/health`.
