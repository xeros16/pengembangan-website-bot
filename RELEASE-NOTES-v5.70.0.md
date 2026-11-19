# PIR Visuals v5.70.0 — Portfolio Storytelling & Workspace Experience

**Base:** PIR Visuals v5.69.0 (the last delivered project package).

**Website package:** 3.24.0  
**Platform version:** 5.70.0

## What changed

### Collection & Moodboard
- Reworked collection detail into an editorial board: image-led cover, board summary, designer cards, and an asymmetric selected-work grid.
- The artwork and designer order follows the curator's stored ID order instead of the database `$in` result order.
- Collection creation includes a live preview for the title, description, and deduplicated designer/work ID counts. Helper copy explains where to find each ID. The existing `/collections/create` form contract is unchanged.
- Collection owners can reorder artwork with drag-and-drop or single-tap move-up/move-down controls, and remove unavailable or unwanted items. The existing `itemIds` form field remains the source of truth on save.
- A polite live region announces reorder/remove results. When JavaScript is unavailable, the manual ID field remains available and the enhanced sorter stays hidden.
- Public share buttons use `/collections/:slug` without a query string. Private boards do not show a share button, avoiding accidental copying of the secret edit key.

### Portfolio case studies
- Added an in-page chapter rail for long case studies, with Overview, Project info, Cover, Gallery, Highlight, Process, Creator, and More work links when those sections exist.
- The rail is only shown when at least four meaningful sections are available, avoiding extra navigation on short pages.
- Active-section state follows the reading position and keeps native anchor navigation.

### Designer Studio
- Added a five-step setup checklist for profile identity, first approved work, active service, public profile, and availability.
- Completion percentage is calculated from existing MongoDB-backed profile/work/service/availability state; no new schema or database collection is introduced.
- Checklist links jump to the corresponding existing Studio sections.

### UI/UX and accessibility
- Refined collection surfaces for Dark and Light themes, including explicit high-contrast CTA and cover-heading colors.
- The sorter supports drag, keyboard-operable move controls, remove controls, focus retention after removal, and screen-reader status announcements. Drag completion produces one announcement.
- Case-study and Studio section navigation use a small passive scroll listener and one animation-frame update for active state; no scroll-jacking or external animation runtime is added.
- New transitions respect Motion Off and `prefers-reduced-motion`.

## Compatibility and preservation

- No new runtime dependency.
- No database model/schema changes.
- No bot, WhatsApp, Game Center, authentication, upload, moderation, or Client Workspace source changes.
- Existing collection create/update routes and their `itemIds`/`designerIds` form fields are retained.
- Service-worker cache advances to `pir-visuals-public-v16`; icon/manifest cache token advances to `v=5700`.

## Install

1. Back up the existing project folder.
2. Extract this ZIP into a new folder.
3. Keep the existing `.env`, MongoDB database, uploads, backups, and WhatsApp session data.
4. From the project root, run `npm run website:install` if website dependencies are not installed.
5. Run `npm run website` and hard-refresh the browser with `Ctrl + Shift + R`.

Do not replace local secrets, session folders, or user uploads with archive contents.

## Verification scope

See `TEST-REPORT-v5.70.0.md` for test counts, browser viewport matrix, theme contrast measurements, and environment limitations. MongoDB and WhatsApp live integration still need to be verified in the user's local environment.
