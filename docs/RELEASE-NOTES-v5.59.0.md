# PIR Visuals v5.59.0 — Experience 2.0

## Major update

### Designer personal brand
- Added optional professional tagline, creative point of view, working approach and ideal-project description fields.
- Added three curated public profile layout presets: Editorial, Minimal and Gallery.
- Added profile-specific SEO title, description and HTTPS social preview image.
- Public profiles render an optional practice-story section when story content is supplied.
- Existing profile records remain compatible; empty fields do not create empty public sections.

### Portfolio case-study experience
- Added optional client/brand, industry, project year, project scope and outcome highlight fields.
- Added project-specific SEO title and description.
- Extended both new-work upload and existing-work edit forms with the new fields.
- Project year is validated to a four-digit year between 1900 and two years ahead.
- Public case-study pages render only available metadata and show an outcome highlight when provided.
- Gallery images now open in the existing accessible, same-origin lightbox rather than a separate browser tab.
- Social preview metadata can safely use a validated local `/media/<itemId>` path or an HTTPS image URL.

### Designer performance intelligence
- Designer Studio now reports profile views, portfolio views and contact clicks for the last 30 days using daily metrics.
- Added profile-to-contact rate with an explicit activity-only explanation.
- Added a 14-day profile traffic chart.
- Added a most-viewed case-study list based on project detail page opens during the last 30 days.
- Project view events store only the event type, normalized public path, internal designer ID and item ID.
- The project-view collector validates the event path and both IDs, uses same-origin POST, and applies the existing transient rate limiter.
- Project-view history starts when v5.59.0 is deployed; no historical per-project counts are backfilled.

### Responsive visual refinements
- Added profile story cards, layout presets, case-study result callouts, richer metadata strips and performance charts.
- Added mobile-specific layouts for profile presets, story cards, and dashboard performance panels.
- Preserved reduced-motion and existing theme support.

## Compatibility and data
- No destructive migration is required.
- Existing MongoDB collections are reused: `designerprofiles`, `portfolioitems`, `portfoliositeanalyticsevents`, and `designeranalytics`.
- New fields are optional and existing records continue to render with the current default profile layout.
- WhatsApp Baileys, bot commands, designer authentication, Owner moderation, lead workflow, and existing upload storage are retained.

## Validation
- Root JavaScript syntax check: 173 files passed.
- Website server/model syntax check: passed.
- Website automated tests: 140/140 passed.
- Root automated tests: 350/356 passed; six cases remain blocked by missing root dependencies (`node-fetch` and `mongoose`) in this build environment.
- Generated analytics client JavaScript parse: passed.
- Inline CSS parse: passed with zero top-level parser errors.
- Live MongoDB and browser end-to-end checks require deployment environment credentials and were not run in this build environment.
