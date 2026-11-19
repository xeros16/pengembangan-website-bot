# PIR Visuals v5.38.0 — Business Platform, Brand & Theme Update

## Brand and experience
- Replaced the generic lettermark favicon/logo with the supplied PIR circular SVG brand icon.
- Updated dark theme colors to the forest-green/olive/beige palette derived from the supplied mark.
- Added persistent dark/light theme toggle, stored locally per browser.
- Updated PWA theme/background colors and service-worker cache to v5.

## Designer Business Studio
- Expanded Designer Studio profile editor with primary category and HTTPS avatar URL, in addition to existing bio, skills, pricing, location, contact and social links.
- Added engagement dashboard with total profile views, portfolio previews, contact clicks and daily metrics.
- Added lead pipeline with statuses: new, contacted, qualified, won and closed.
- Added availability planner for dates and statuses: available, busy, unavailable.
- Added designer activity notifications for new leads, lead status changes and calendar changes.

## Client discovery and direct enquiries
- Added design category directory at `/categories` and category filter in discovery.
- Added a direct brief form at `/contact/:designerId`. Submitted briefs are stored as designer leads and notifications; clients and designers continue negotiating and transacting directly.
- No checkout, escrow, bot-mediated order or platform payment feature was introduced.

## Reviews
- Added public review submission with email verification links that expire after 30 minutes.
- Verified reviews enter Owner Dashboard moderation and are not public until approved.
- Public profile only renders published and email-verified reviews.
- Designer-created testimonial entries cannot bypass email verification and Owner moderation.

## Owner content management
- Added homepage CMS fields (headline, subtitle, announcement) in the existing Owner Dashboard.
- CMS updates are protected by Owner Basic Auth, same-origin validation and Owner CSRF cookie.

## SEO and performance
- Added robots.txt and category page to sitemap.
- Added Organization JSON-LD structured data to public page shell.
- Added lazy loading/async decoding for public portfolio images and immutable cache headers for approved media.
- Existing image upload pipeline continues to use Sharp for image processing.

## Compatibility
- MongoDB collections are additive; existing designer, portfolio, service, auth and analytics collections are preserved.
- Existing Baileys bot, separate website process, and separate Game Center architecture remain unchanged.
- Existing Designer Studio login, password reset, portfolio upload, collections, services and Owner Dashboard routes remain available.

## Validation
- Website syntax and 48 website tests pass.
- Website npm check passes.
- Root JavaScript syntax check passes (175 files).
- Selected root regression tests pass (11 tests).
- Live MongoDB/SMTP, Cloudflare Tunnel, cross-device browser and visual QA must be completed on the Windows deployment.
