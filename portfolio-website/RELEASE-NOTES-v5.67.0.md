# PIR Visuals v5.67.0 — Mobile Button Alignment Refinement

## Basis
Built directly on PIR Visuals v5.66.0. Existing routes, marketplace data, authentication, Designer Studio, Client Workspace, WhatsApp integration, theme behavior, and motion controls are retained.

## Mobile navigation polish
- Rebuilt the Menu/Tutup toggle alignment with a fixed 22px icon slot, centered label/icon group, and a consistent 11–12px gap.
- Normalized mobile navigation controls to inline-flex alignment, fixed icon slots, consistent line-height, and 50px minimum touch targets.
- Kept Portal desainer centered on its own full-width row with a 54px minimum height.
- Forced Cari to occupy its own full-width row and align its icon/label with a comfortable gap.
- Centered Motion and Tema labels/icons within equal-width columns using explicit grid areas, preventing the three-button squeeze seen on narrow screens.
- Kept the two-column utility layout at widths up to 380px.
- Kept the desktop navigation untouched; all new layout rules are scoped to mobile breakpoints.

## Versioning
- Root project: 5.67.0
- Website package: 3.21.0
- Public service-worker cache: pir-visuals-public-v13
- Icon cache query: v567

## Validation
- Website regression suite: **188/188 passed**.
- JavaScript syntax: **173 files passed** (`node scripts/check-js.js`).
- Website server/model syntax: passed (`npm run website:check`).
- CSS parse: **0 errors** across 1,847 top-level stylesheet nodes.
- ZIP integrity: validated with `unzip -t` after archive creation.
- Live browser/device visual QA and MongoDB smoke test were not run in this environment; verify after local installation.
