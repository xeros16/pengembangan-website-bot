# PIR Visuals v5.34.0 — Integration & End-to-End Reliability

## Bot
- Added local-only HTTP readiness endpoint at `127.0.0.1:3091/health` (configurable port).
- Reports MongoDB connectivity and Baileys connection lifecycle; HTTP 200 only when both are ready, otherwise 503.
- Endpoint binds only to loopback addresses and does not expose credentials, JIDs, QR codes or session data.

## Integration diagnostics
- Added `npm run doctor:integration`.
- Compares bot and website MongoDB database names and resolved portfolio media directories.
- Checks public URL consistency, SMTP, owner dashboard credentials and Baileys auth directory.
- Does not print MongoDB URI credentials, SMTP password or dashboard password.

## Website smoke test
- Optional `PIR_CHECK_BOT_HEALTH=true` mode checks the bot's readiness endpoint in addition to public website, SEO and PWA routes.
- Added regression tests for bot health state, loopback binding and cross-process smoke validation.

## Compatibility
- Baileys remains the WhatsApp transport.
- Website remains a separate process.
- Game Center remains independent.
- No existing portfolio URLs or designer IDs were removed.

## Validation
- `node scripts/check-js.js`: 175 JavaScript files lulus.
- Website checks: lulus; website tests 30/30.
- Integration doctor and bot health tests: 5/5.
- Backup tests: 2/2; Designer Studio regression: 4/4.
- Root suite: 328 lulus, 7 gagal karena dependensi `mongoose` dan `sharp` belum tersedia pada lingkungan build.
- Live MongoDB dan live WhatsApp message exchange are not simulated by unit tests; execute the Windows staging acceptance test in `docs/RELEASE-v5.34.0-INTEGRATION.md`.
