# PIR Visuals v5.66.0 — Mobile Navigation Refinement

## Basis
Built directly on PIR Visuals v5.65.0. Existing routes, database models, marketplace features, Designer Studio, Client Workspace, WhatsApp integration, theme behavior, and motion controls are retained.

## Mobile navigation changes
- Increased the mobile header and Menu control touch targets while preserving the existing desktop navigation.
- Aligned the expanded navigation panel to the actual mobile header width to prevent horizontal overflow.
- Increased spacing, padding, corner radius, and tap-target height for the primary navigation links and the Lainnya menu.
- Reorganized the action area into clearer groups: Portal desainer on its own full-width row, Cari on its own full-width row, then Motion and Tema side by side.
- Added theme-specific utility button surfaces for predictable contrast in Dark and Light Mode.
- Kept the panel vertically scrollable on short phone screens and enabled momentum scrolling on touch devices.
- Reasserted the two-column utility layout at widths of 380px and below so the older three-column rule cannot squeeze controls.
- Respected reduced-motion settings.

## Versioning
- Root project: 5.66.0
- Website package: 3.20.0
- Public service-worker cache: pir-visuals-public-v12
- Icon cache query: v566

## Validation
- Website regression suite: **183/183 passed**.
- JavaScript syntax: **173 files passed** (`node scripts/check-js.js`).
- Website server/model syntax: passed (`npm run website:check`).
- CSS parse: **0 errors** across 1,787 top-level stylesheet nodes.
- ZIP integrity: passed (`unzip -t`).
- Root bot suite: **350/356 passed**; 6 tests are blocked in this environment because runtime packages `node-fetch`, `sharp`, and `mongoose` are not installed in the extracted workspace.
- Live browser/device visual QA and MongoDB smoke test were not run in this environment; verify them after local installation.
