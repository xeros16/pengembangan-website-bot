# PIR Visuals v5.63.0 — Responsive Editorial Refinement

## What changed
This release is a focused visual refinement based on the user's screenshots. It addresses the crowded top navigation and the perception of clipped oversized hero typography while preserving the v5.62 visual identity, dark/light themes, editorial motion, and existing routes.

### Adaptive navigation
- Reorganized the top navigation into four primary destinations: Home, Discover, Categories, and Moodboard.
- Moved Favorites, Shortlist, About, and How it Works into a native disclosure menu.
- Grouped Designer Portal, quick search, motion preference, and theme controls into one utility area.
- Added an adaptive compact navigation panel below 1180px, with a two-column link layout, right alignment, bounded height, and internal scrolling.
- Added a visible Menu/Close label and icon state, synchronized `aria-expanded` and `aria-label`, and close behavior for route selection, outside click, and Escape.
- Preserved every prior navigation destination and the existing quick-command, theme, and motion controls.

### Hero typography and responsive composition
- Rebalanced the hero grid to become a single-column editorial layout below 1180px so the title no longer competes with the live directory card in a narrow column.
- Replaced rigid headline sizing with a fluid `clamp()` scale and `ch`-based measure.
- Applied balanced heading wrapping and pretty paragraph wrapping.
- Kept the headline and animated word wrappers overflow-visible to avoid clipping glyphs and animation movement.
- Allowed hero content to determine its natural height; tuned compact-screen font size, spacing, buttons, index card, and bottom label.
- Retained the original desktop two-column composition at wider sizes.

### Visual consistency and accessibility
- Unified nav surfaces using the existing design tokens and separate light-theme surface treatments.
- Improved menu focus states and accessible names.
- Kept the reduced-motion media query and user motion toggle behavior.
- Advanced the public service-worker cache to `pir-visuals-public-v9` and refreshed the icon cache query to v563.

## Research basis
The refinement uses established responsive design and accessibility practices: balanced text wrapping, content-first responsive layouts, responsive spacing, adaptive navigation, visible focus states, and reduced-motion support. References include MDN text wrapping and responsive design, web.dev typography and motion guidance, Android adaptive navigation patterns, and GOV.UK spacing and style guidance. These are principles, not copied visual assets or components.

## Version
- Root application: `5.63.0`.
- Website package: `3.17.0`.

## Validation
- `npm run check`: passed, 173 JavaScript files.
- `npm run website:check`: passed.
- `npm run website:test`: passed, 171/171 tests.
- Generated `public-ui.js`: extracted and passed `node --check`.
- Inline website CSS: 1,645 top-level rules parsed with zero CSS parser errors.
- Root `npm test`: 350/356 passed. Six existing test files are blocked by unavailable runtime dependencies in this build environment (not by this navigation/CSS change); errors include missing `node-fetch` and `mongoose` packages.
- Live MongoDB, SMTP, Baileys pairing, and production browser/device visual QA were not run in this build environment.

## Manual viewport QA checklist
Review after installing on the user's Windows machine at widths 360px, 390px, 768px, 960px, 1180px, 1280px, and 1440px. Check both themes, open/close navigation, keyboard Escape, long designer names, and the full hero below the fold.
