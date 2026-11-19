# PIR Visuals v5.72.0 — Navigation Restoration & Content Integrity

**Base:** PIR Visuals v5.71.0  
**Website package:** 3.26.0  
**Platform version:** 5.72.0

## What changed

### Navigation repair
- Fixed the actual cause of inaccessible top navigation controls: `.nav-more-menu` used author CSS `display:grid`, which overrode the browser's native closed `<details>` behavior. The submenu was therefore still rendered while closed and could cover or compete with utility actions.
- The submenu is now explicitly hidden while its `<details>` parent is closed and shown only while expanded.
- Consolidated mobile menu state, outside-click handling, route selection, Escape dismissal, and focus restoration into one controller.
- Added synchronized `aria-expanded` state for the Lainnya disclosure.
- Preserved the responsive absolute-positioned menu panel and bounded mobile scrolling; the panel remains correctly sized at 320px and larger.
- Increased the navigation stacking layer so open navigation panels remain above page content.

### Navigation completeness
- Added **Ruang klien** (`/client`) and **Contact & support** (`/contact`) to the Lainnya menu.
- Existing destinations remain available: Beranda, Jelajahi, Kategori, Moodboard, Favorit, Shortlist, Tentang, Cara kerja, and Portal desainer.
- Existing command palette and footer links are retained.

### Motion restoration and immersive polish
- Restoring Motion On from a saved Motion Off preference now reloads the current page once so scroll reveal observers and pointer interactions are initialized again; a brief confirmation appears after reload.
- Added progressive same-origin View Transitions for the main content while keeping the persistent navbar stable.
- Added a subtle case-study cover parallax and a reading-progress indicator for the chapter navigation.
- Added a short image transition to the fullscreen gallery and staggered entrances for filtered works that reappear.
- Motion Off and the operating-system reduced-motion preference disable the new decorative transitions.

### Compatibility
- No database schema, migration, authentication, upload endpoint, portfolio record, WhatsApp session, bot command, or game behavior changes.
- Service-worker cache advances to `pir-visuals-public-v18`; public asset cache-busting advances to `v=5720`.
- No existing source file was removed.
- Generated `node_modules` folders are intentionally excluded from this clean source ZIP. Install dependencies using the commands below.

## Install

1. Back up the current project folder.
2. Extract this ZIP into a new folder.
3. Keep the existing `.env`, MongoDB data, uploads, backups, and WhatsApp session data.
4. Run `npm install` from the project root.
5. Run `npm run website:install` to install the website package dependencies.
6. Run `npm run website`.
7. Hard-refresh the browser with `Ctrl + Shift + R`.

Do not replace local secrets, session folders, or user uploads with archive contents.

## Verification scope

See `TEST-REPORT-v5.72.0.md` and `docs/NAVIGATION-RESTORATION-v5.72.0.md`. Automated tests and browser fixtures do not replace live MongoDB, SMTP, WhatsApp, and persistent media-upload verification in the user's environment.
