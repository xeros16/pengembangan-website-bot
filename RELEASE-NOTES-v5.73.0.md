# PIR Visuals v5.73.0 — Public UI Runtime & Navigation Repair

**Base:** PIR Visuals v5.72.0  
**Website package:** 3.27.0  
**Platform version:** 5.73.0

## Critical fix: public UI script could not execute

The website serves `public-ui.js` from a JavaScript template literal inside `portfolio-website/server.js`. The quick designer preview contained an HTTPS regular expression whose slash escapes were consumed while the template was interpolated. The emitted asset therefore contained an invalid expression (`/^https:///i`). Because the browser parses a script before executing it, the syntax error prevented the entire public controller from running—not just the quick preview. This included the mobile navbar controller, the `Lainnya` disclosure, theme toggle, favorites, shortlist and other progressive-enhancement handlers.

The template now double-escapes the backslashes at the server-source layer so the browser receives valid JavaScript. A regression test evaluates the exact template content and parses the emitted script with `vm.Script`, preventing this class of failure from returning.

## Navigation behavior

- The `Lainnya` summary now controls the native `<details>` state explicitly and synchronizes `aria-expanded` immediately after click or keyboard activation.
- Mobile menu open/close behavior remains centralized in one controller.
- Outside click, route selection, Escape dismissal, focus restoration, and resize cleanup are retained.
- The compact panel remains scrollable and aligned to the header; desktop navigation remains visible without the compact toggle.

## Related interaction fixes

- The selected-work filter initializes the reduced-motion preference before filter setup.
- Filtered cards now receive their index when iterated, preventing a `ReferenceError` when previously hidden cards re-enter the grid.
- Existing semantic reveal families, image transitions, Motion Off, system reduced-motion support, and visual theme tokens are preserved.

## Cache and compatibility

- Platform package: `5.73.0`.
- Website package: `3.27.0`.
- Public service-worker cache: `pir-visuals-public-v19`.
- Public asset cache-busting token: `v=5730`.
- No database schema, migration, authentication flow, bot command, WhatsApp session, portfolio record, media-upload endpoint, or game behavior was changed.

## Verification

See `TEST-REPORT-v5.73.0.md` and `docs/qa/NAVIGATION-INTERACTION-v5.73.0.json`.

## Clean-package and local-state handling

This source ZIP intentionally excludes installed `node_modules`, `.env`, WhatsApp authentication/session folders, local database exports/backups, temporary files, local group data, and user upload contents. Keep the existing local copies when updating the project; do not overwrite them with a source archive. The ZIP includes `.env.example` files for reference.

Recommended update procedure:

1. Stop the running bot and website processes.
2. Make a separate backup of the current `.env`, WhatsApp session folder, MongoDB data/backup, `data.json`, `data/pinsearch-history.json`, and `uploads/portfolio`.
3. Extract the new source into a new folder or merge only tracked source files; retain the existing local-state files above.
4. Run `npm install` from the project root if dependencies are not already installed.
5. Run `npm run website:install` if website dependencies are not already installed.
6. Run `npm test`, `npm run website:test`, and `npm run website:check`.
7. Start the website with `npm run website`, then hard-refresh the browser (`Ctrl + Shift + R`).

If the previous ZIP or its session/config files were shared outside the intended environment, rotate the exposed service credentials and re-link the WhatsApp device before production use.
