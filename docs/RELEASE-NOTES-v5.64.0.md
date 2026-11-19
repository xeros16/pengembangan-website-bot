# PIR Visuals v5.64.0 — Contrast, Navigation & Motion Refinement

## Basis
Built directly on the uploaded `PIR-Visuals-v5.63.0-Responsive-Editorial-Refinement.zip`. Existing application routes, marketplace data, designer/client workspaces, bot integration, and v5.63 adaptive navigation are retained.

## What changed
- Introduced a final semantic color layer for Light and Dark themes, with clearer heading/body/helper text hierarchy and consistent form, table, card, tag, and button contrast.
- Repaired the Light Mode hero/index, Shortlist, Designer Studio surfaces, category index text, and footer readability without flattening intentionally dark editorial panels.
- Reworked the global canvas to use sparse diagonal linework and a single irregular organic outline rather than a dense grid or concentric decorative rings.
- Refined the compact navigation panel with clearer link grouping, larger hit areas, stronger surface separation, and more breathing room around utility actions.
- Theme and motion controls now retain their icon/label structure, display compact state labels, and expose state-aware accessible names. This avoids the motion script replacing the button's child markup and breaking its layout.
- Added subtle navigation/button hover and press feedback while preserving the existing scroll reveal, hero motion, carousel, command palette, and reduced-motion support.
- Refreshed public service-worker cache to `pir-visuals-public-v10` and icon query to `v564`.

## Version
- Root application: `5.64.0`.
- Website package: `3.18.0`.

## Validation
- `npm run website:check`: passed.
- `npm run website:test`: 173/173 passed.
- `npm run check`: passed, 173 JavaScript files.
- Root `npm test`: 350/356 passed; six unrelated test cases could not load because `node-fetch` is not installed in this build sandbox.
- CSS parsed with `tinycss2`: no parse errors.
- ZIP integrity: verified.
- Live MongoDB/SMTP/WhatsApp pairing and production browser/device visual QA were not run in this environment.

## Manual viewport QA
After installation, verify both themes at 360px, 390px, 768px, 960px, 1180px, 1280px, and 1440px. Check navigation open/close, Escape, long names, form labels, shortlist tables, category tiles, Designer Studio, and reduced-motion settings.
