# PIR Visuals v5.40.0 — Homepage Experience

## Visual direction
- Dark mode is dimensional graphite/charcoal with subtle ambient gradients, layered cards, glass navigation and restrained sage accents.
- No centered decorative logo/watermark in the homepage.
- Existing light theme remains available with high-contrast text.

## Homepage carousel
- New responsive homepage highlight carousel with auto-advance every 6.5 seconds.
- Manual controls: previous/next arrows and slide dots.
- Pauses while hovered/focused or when the browser tab is hidden.
- Respects `prefers-reduced-motion`.
- Displays up to three Owner-managed slides plus automatically curated featured designers and latest approved portfolio work.
- Slide types include Event, Designer pilihan, Portfolio, Pengumuman and Highlight.
- External banner images/links must use HTTPS; local portfolio media paths are also supported.

## Owner dashboard
- `/dashboard` now includes three banner editor slots under Kelola homepage & banner slide.
- Owner can set enable/disable, type, eyebrow, title, description, image, destination URL and CTA text.
- Content is stored in `PortfolioSiteContent` and can be edited without changing source code.

## Validation
- Added regression tests for slide rendering, Owner editor, carousel controls and dark theme layering.
- Run website tests and JavaScript syntax checks before deployment.
