# PIR Visuals v5.65.0 — Theme Contrast Repair

## Basis
Built directly on `PIR-Visuals-v5.64.0-Contrast-Navigation-Motion-Refinement.zip`. Existing routes, marketplace data, Designer Studio, Client Workspace, bot integration, and motion behavior are retained.

## Fixes
- Fixed category-card foreground colors being overwritten by global theme selectors. Every category tile now keeps its own `--cat-ink`, `--cat-muted`, and `--cat-accent` tokens in both Light and Dark Mode.
- Tuned several category palette values so normal and small text reach WCAG AA contrast against their fixed editorial backgrounds.
- Fixed the `Portal desainer` navigation CTA with explicit high-contrast foreground/background pairs in both themes, including its icon, hover, and focus states.
- Fixed pale-on-pale text in the homepage `Temukan desainer` and `Bangun portfolio kamu` CTAs.
- Preserved the dark editorial join panel in Light Mode and restored its light heading, body, label, and button text.
- Reinforced form placeholder and helper-text contrast without changing application behavior.
- Bumped the public service-worker cache to `pir-visuals-public-v11` and the health endpoint version to `5.65.0`.

## Versions
- Root application: `5.65.0`.
- Website package: `3.19.0`.

## Validation
- JavaScript syntax and website syntax checks: run after patch.
- Website tests: run after patch.
- CSS syntax: checked with `tinycss2` when available.
- Category palette contrast: checked against WCAG AA threshold 4.5:1 for normal text.
- ZIP integrity: verified after packaging.
- Live database and browser/device visual QA remain environment-dependent and should be confirmed after local installation.
