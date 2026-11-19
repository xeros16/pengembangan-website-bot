# PIR Visuals v5.36.0 — Website Experience Overhaul

## Public website UI/UX
- Rebuilt global page shell with branded responsive navigation, mobile menu, clearer visual hierarchy, accessible focus styles and consistent design tokens.
- Added always-visible Designer Studio login navigation.
- Added favorites navigation and count badge.
- Improved directory hero, summary statistics, search/filter layout, designer cards and how-it-works section.
- Added responsive layouts for mobile and tablet.

## Smart Discovery
- Search by name, bio, skill and location.
- Filter by skill, location, verified status, featured status, availability for new projects, and minimum/maximum starting price.
- Sort by recommended, name, lowest starting price and highest starting price.
- Added result count and reset-filter action.

## Favorites
- Visitors can favorite designers without creating a client account.
- Favorites are stored locally in the visitor's browser (up to 100 IDs).
- Added `/favorites` page.
- Added public-only `/api/designers?ids=...` endpoint, limited to 50 valid IDs.
- Private profiles are never returned by the favorites API.

## Portfolio and analytics
- Designer portfolio pages include favorite control.
- Engagement summary displays profile views, portfolio previews and contact clicks.
- Updated service-worker cache version to v3.

## Compatibility
- Existing `/studio` login and Designer Studio reset-password routes remain available.
- Existing designer IDs, `/designer/:id` and `/p/:slug` routes are preserved.
- WhatsApp transport remains Baileys; website remains a separate process; Game Center remains separate.
- Favorites do not create client accounts or handle orders/payments; clients continue contacting designers directly.

## Validation
- Website server syntax and website unit tests are recorded in build output.
- Live MongoDB, real browser rendering, Cloudflare tunnel and cross-device favorites persistence need validation on the Windows deployment.
