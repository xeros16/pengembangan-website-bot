# PIR Visuals v5.33.0 — Integration Readiness & Smoke Testing

## Changes
- Added repeatable live website smoke test (`portfolio-website/scripts/smoke-test.js`) and `npm run smoke`.
- Smoke test checks MongoDB readiness, public directory, robots.txt, sitemap, PWA manifest, service worker, and Designer Studio login page.
- Website `npm run check` now syntax-checks the smoke test too.
- Fixed sitemap URLs to use custom public portfolio slugs (`/p/:slug`) when configured, while preserving legacy `/designer/:id` URLs.
- Added regression tests for custom-slug sitemap output and smoke-test coverage.
- Added Windows deployment and manual shared-data verification instructions in `docs/RELEASE-v5.33.0-SMOKE-TEST.md`.

## Compatibility
- Baileys remains the WhatsApp transport.
- Website remains a separate process and shares the bot's MongoDB database and configured portfolio media directory.
- Game Center remains separate from the website.
- Existing designer IDs and `/designer/:id` routes remain compatible.

## Validation
- `node scripts/check-js.js`: 172 JavaScript files lulus.
- Website checks: syntax check lulus; 29/29 website tests lulus.
- Backup hardening tests: 2/2 lulus.
- Designer Studio regression tests: 4/4 lulus.
- Root suite: 323 lulus, 7 gagal karena `mongoose` dan `sharp` belum terpasang pada lingkungan build; bukan klaim lulus penuh.
- Live smoke test requires a running website and reachable MongoDB; it is supplied for execution on the Windows machine.
