# PIR Visuals Bot v6.6.0 — Creative Asset Studio & Design Seasons

## Highlights

### 1. Creative Asset Studio
- Added `.assetstudio` for group-scoped reference records: title, category, HTTPS source URL, license label, attribution note, and tags.
- New records are private to the owner by default. The owner must explicitly confirm `.assetstudio bagikan KODE konfirmasi` before the record appears in group search.
- Owners can list, search their own records, inspect permitted details, return shared records to private visibility, and soft-delete their own records.
- Admins can hide/restore only group-shared records. Private records are not exposed through group search or detail lookup.
- The feature stores metadata and a link; it does not download, mirror, or upload the referenced file. Sharing a link does not grant reuse rights.

### 2. Design Seasons
- Added `.designseason` for group-only competitions with 2–8 rounds and 1–168 hours per round.
- A season is prepared as a draft, receives its rounds, then an Admin/creator starts it. Only one round can be open at a time.
- At most one active season per group is enforced by a partial unique MongoDB index.
- Participants submit one active work per round. Updating a work resets earlier peer reviews for that work.
- Gallery, feedback, and results remain group-scoped. Peer review is one review per reviewer per work and closes with the round; final results are only available after the season completes.
- Admin moderation can hide/restore entries. A hidden entry cannot bypass moderation by resubmitting.
- Expired rounds are reconciled when a season command reads/uses the season; no background scheduler is introduced.

### 3. Sticker Studio & Image Safety
- Added `.sticker bulat` for circular static image stickers and `.sticker help` for usage guidance.
- Static sticker encoding reduces quality progressively and checks the final WhatsApp 1 MB limit, including metadata.
- Animated sticker output is also checked against 1 MB; temporary input/output files are cleaned on failures.
- Image transforms validate input dimensions (maximum 40 megapixels and 12,000 px per side) before Sharp transforms.
- Resized/cropped/converted/compressed outputs are capped at 12 MB. Palette extraction now handles RGB channels consistently.
- AI upscaler output must be an image, between 1 byte and 12 MB, and pass image-dimension validation.

### 4. Music & Website
- Added `.music top` using Apple's Indonesia Top Songs RSS feed. It displays metadata and official Apple Music/iTunes links only; it does not send or download audio.
- Added public `/creative-studio` guide for Asset Studio, Sticker Studio, Design Seasons, music, anime, and media workflows.
- Added the route to website navigation, quick navigation, footer, and sitemap. It uses the shared semantic Light/Dark visual system and does not read private WhatsApp or asset data.
- Command Explorer now includes Design Seasons and Creative Asset Studio workflows.

## Database changes

Three additive collections are introduced:
- `designseasons`
- `designseasonsubmissions`
- `creativeassets`

The release adds unique/group-scoped indexes, including one active season per group and one submission per participant per round. Existing collections are not dropped or destructively migrated. Run `npm run db:ensure-shared-indexes` and `npm run verify:database` before enabling the new features.

## Dependencies

- No new runtime npm dependency.
- Node.js 18+ recommended.
- Bot package: `6.6.0`.
- Website package: `3.49.0`.

## Validation boundary

Automated unit/source tests cover permission boundaries, group isolation, explicit sharing, moderation, season lifecycle, review freeze, hidden-entry bypass prevention, image dimension guards, chart parsing, routing, and generated catalog. Live WhatsApp, MongoDB index creation, Apple RSS availability, FFmpeg/Sharp media processing, and browser visual acceptance still require staging on the deployment environment. See `QA_REPORT_v6_6_0.md`.
