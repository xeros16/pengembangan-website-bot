# PIR Visuals v5.58.0 — Marketplace Intelligence & Visual Refresh

## Major update

### Owner Growth Intelligence
- Added a 30-day growth dashboard inside the existing Owner-only dashboard.
- Added public page views, designer profile views, direct contact clicks and incoming project briefs.
- Added a discovery-to-inquiry funnel with transparent ratio labels.
- Added designer activity ranking based on recorded contact clicks and profile views over the last 30 days.
- Added campaign click reporting for homepage carousel banners.
- Added category discovery click reporting.
- Added lead pipeline counts by status and lead source.

### Privacy-conscious event tracking
- Added a same-origin `/api/track` collector and `/analytics-ui.js` client.
- Tracks public page views, category clicks, search activity, campaign CTA clicks and contact actions.
- Successful project brief submissions are recorded as lead conversion events.
- Only event type, normalized public path, allowed category, banner slot and internal designer/item IDs are stored.
- Does not store IP addresses, email addresses, phone numbers, free-text searches, or full query strings.
- Adds origin validation, event allowlists, campaign/category validation, bounded request size and short IP-based rate limiting. IP addresses are used only transiently by the existing in-memory rate limiter and are not persisted.
- Campaign reporting counts CTA clicks, not impressions; no click-through rate is claimed.

### Public website visual refresh
- Reworked the global palette into a warm editorial light theme and a textured charcoal dark theme.
- Added restrained flowing ribbon linework and irregular organic forms to the background, without dense repetitive patterns.
- Rebalanced homepage hero, index panel, category tiles, portfolio showcase, manifesto, join CTA and carousel.
- Improved theme toggle spacing and mobile navigation surface contrast.
- Updated browser theme color and PWA manifest colors to match the new charcoal/cream identity.
- Standardized buttons, cards, inputs, chips, borders and footer colors across both themes.
- Preserved the deep high-contrast footer treatment in light and dark mode.
- Added responsive layouts and reduced-motion support.

## Compatibility
- WhatsApp Baileys, bot commands, game module, designer authentication, direct client-to-designer contact and existing order/lead workflow remain unchanged.
- Existing `DesignerAnalytics` and `DesignerLead` collections are reused.
- Added one new MongoDB collection: `portfoliositeanalyticsevents`, with schema-managed indexes. No destructive migration is required.
- Homepage campaigns use stable identifiers for the three editable CMS slides plus the featured-designer and latest-portfolio carousel slots.
- Historical campaign/category click data is not backfilled; those metrics begin when v5.58.0 is deployed.

## Validation
- Website syntax check: passed.
- Website automated tests: 133/133 passed.
- Root JavaScript syntax check: 173 files passed.
- Root automated tests: 350/356 passed; 6 test files/cases are blocked in this build environment because root `node_modules` are not installed (`node-fetch` and `mongoose` are missing).
