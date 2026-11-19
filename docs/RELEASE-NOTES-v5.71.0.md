# PIR Visuals v5.71.0 — Immersive Portfolio Discovery & Studio Controls

**Base:** PIR Visuals v5.70.0.

**Website package:** 3.25.0  
**Platform version:** 5.71.0

## What changed

### Portfolio image experience
- Replaced the single-image preview with a fullscreen, grouped gallery viewer.
- Added previous/next controls, image counter, captions, keyboard arrows, touch swipe, backdrop close, and focus return.
- Preserved direct `/media/...` links as a no-JavaScript fallback.

### Designer discovery
- Added a Quick View action to reusable designer cards. It previews public name, location, bio, discipline, starting price, specialties, and avatar without navigating away.
- Added a Selected Work stream to `/discover`, based on approved portfolio items and public creator profiles.
- Added client-side category chips and title/category search; existing server-side designer filter parameters remain unchanged.

### Designer Studio
- Analytics chart can switch between profile views, contact clicks, and portfolio views using the already-stored daily metrics. No new metrics or schema are introduced.
- Upload preview now validates file type, 8 MB per image, and a five-image limit; users can remove selected images before native multipart upload.
- Drag-and-drop and keyboard file selection remain available.

### Motion, accessibility, and compatibility
- New interactions use restrained transitions and preserve Motion Off / `prefers-reduced-motion`.
- Dialogs use native modal semantics, keyboard controls, accessible labels, and focus restoration.
- No new runtime dependency or database schema change.
- Existing authentication, WhatsApp, bot, moderation, project rooms, collections, collection IDs, and upload endpoint are retained.
- Service-worker cache advances to `pir-visuals-public-v17`; icon/manifest token advances to `v=5710`.

## Install

1. Back up the current project folder.
2. Extract this ZIP into a new folder.
3. Keep the existing `.env`, MongoDB database, uploads, backups, and WhatsApp session data.
4. Run `npm run website:install` if website dependencies are not installed.
5. Run `npm run website`, then hard-refresh with `Ctrl + Shift + R`.

Do not replace local secrets, session folders, or user uploads with archive contents.

## Verification scope

See `TEST-REPORT-v5.71.0.md` and `docs/INTERACTION-DESIGN-NOTES-v5.71.0.md`. Automated source and browser-fixture tests do not replace a live MongoDB, SMTP, WhatsApp, and local-upload verification in the user's environment.
