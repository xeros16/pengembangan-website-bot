# PIR Visuals Website v3.60.0

## Standalone Community Showcase

- Replaced the hero-coupled campaign carousel with a dedicated Community Showcase section below the homepage hero and motion ribbon.
- Added five independently navigable categories: Karya Terbaru, Karya Unggulan, Karya Termahal, Karya Termurah, and Event PIR Visuals.
- Latest, featured, highest starting-price, and lowest starting-price cards are sourced only from approved portfolio items owned by public designer profiles.
- The highest/lowest categories use `priceFrom` and exclude works without a listed starting price.
- Owner events are stored in the homepage CMS, separate from designer portfolio uploads. Up to five events can include date, kind, description, poster/video, destination link, and visibility.
- Showcase image and video frames preserve source aspect ratio with `object-fit: contain`, including mobile layouts.
- Added independent tab, dot, previous/next, touch-swipe, keyboard, autoplay, and reduced-motion behavior.
- Showcase CTA clicks are included in Owner campaign analytics.

## Owner Control Center

- Expanded `/dashboard` with navigation and a dedicated portfolio manager.
- Owner can add a work on behalf of an existing designer, replace media, edit title/category/description/starting price, mark it featured, approve/reject/return it to moderation, or delete it.
- Owner can manage public/verified/featured/accepting-orders flags and price ranges for designer profiles.
- Added five event slots in Visual Site Studio for Owner event publishing.
- Existing moderation queue, testimonials, support inbox, analytics, and homepage media management remain available.
- All new Owner POST actions retain HTTP Basic Authentication, origin validation, and the Owner CSRF token.

## Compatibility and validation

- No database migration is required; new event data is stored in the existing `PortfolioSiteContent` homepage document.
- Existing uploaded campaign slides remain stored for backward compatibility but are no longer coupled to the homepage hero carousel.
- Normal designer uploads now explicitly record `createdAt` and `updatedAt` so the latest-work category remains reliable when the website runs as a separate process.
- Service-worker cache advanced to `pir-visuals-public-v47`.
- Website package version: `3.60.0`; Bot package target version: `6.7.13`.
