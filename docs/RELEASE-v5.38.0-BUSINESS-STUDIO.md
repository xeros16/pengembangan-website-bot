# PIR Visuals v5.38.0 — Setup and Feature Guide

## Brand and theme
- The uploaded PIR circular SVG is served as `/icon.svg`, used in the site header and PWA manifest.
- Dark is the default theme. Use **◐ Tema** in the top navigation to switch to light. Preference is saved in the current browser only.

## Designer Studio profile editing
1. Sign in at `/studio`.
2. Open **Edit profil desainer**.
3. Update display name, custom URL, bio, skills, software, experience, location, primary category, avatar HTTPS URL, WhatsApp, social links and starting price.
4. Toggle whether you accept projects and whether the profile is public.
5. Save changes. The public profile reflects the saved values.

## Business dashboard
- **Performance**: profile views, portfolio previews, contact clicks and daily metrics.
- **Leads**: visitor briefs submitted from `/contact/:designerId`. Change each lead's follow-up status.
- **Availability**: add a date with available, busy or unavailable status.
- **Notifications**: new lead, status update and calendar update activity.

## Client contact flow
Clients open a designer profile and choose Contact Designer. They submit a project brief, which appears in the designer's Leads panel. The platform does not process payments or mediate orders. Designer contacts the client directly to discuss the work.

## Categories
Open `/categories`. Selecting a category opens `/discover` with the category filter applied. Available categories are curated defaults; the designer's primary category can be set in Designer Studio.

## Reviews
1. Visitor submits a review with email from the designer's public profile.
2. Website sends a verification link (requires SMTP settings).
3. Link expires after 30 minutes.
4. After email verification, the review waits in Owner Dashboard moderation.
5. Owner approves or rejects it. Only approved, email-verified reviews appear publicly.

## Homepage CMS
1. Open `/dashboard` with Owner Basic Authentication.
2. Scroll to **Kelola konten homepage**.
3. Edit headline, subtitle and optional announcement.
4. Save. Changes are stored in MongoDB and shown on the public homepage.

## SEO and deployment
- `robots.txt`, `sitemap.xml`, Organization JSON-LD, lazy-loaded portfolio media and long-lived cache headers are enabled.
- Check `PORTFOLIO_PUBLIC_BASE_URL`, SMTP variables, and MongoDB connection before public release.
- On Windows, back up the current source and `portfolio-website/.env`, stop only the website process, extract to a new directory, restore `.env`, run `npm install`, `npm run check`, `npm test`, then `npm start`.
- Test the real public domain/tunnel, email delivery, and the site on desktop and mobile browsers.
