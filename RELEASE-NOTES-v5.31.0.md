# PIR Visuals v5.31.0 — Security, PWA & Designer Experience

## Improvements
- Custom public portfolio URL (`/p/:slug`) with collision checks and existing ID URLs retained.
- Password recovery via verified email; reset tokens are random, stored hashed, expire after 20 minutes, and revoke all active sessions.
- PWA manifest, SVG app icon, service worker, and install registration.
- Service worker caches only successful public-cache GET responses; explicitly bypasses studio, dashboard, admin, media, and contact routes.
- Studio uploader preview and PWA registration moved to external JavaScript files to comply with the website Content Security Policy.
- Owner moderation now uses same-site CSRF cookie plus hidden token in addition to HTTP Basic Auth and Origin validation.
- Fixed media upload-root resolution to use BOT_DATA_ROOT consistently with the upload writer.
- Password-reset requests are rate-limited per client IP.
- Removed unused `node-fetch` import from image-processing module; Node.js 20+ native fetch is used.
- Root and website package versions bumped to 5.31.0 and 1.5.0.

## Configuration
- Custom URL is optional and can be set in Designer Studio profile.
- Password recovery requires SMTP configuration, same as email verification.
- PWA works over HTTPS in production (or localhost for local development).
- Existing `/designer/DSN-ID` URLs continue to work; `/p/slug` is an additional route.

## Security notes
- PWA cache never stores private dashboard, studio, admin, media or contact routes.
- Password reset link expires in 20 minutes and is one-time.
- Password reset invalidates all active designer sessions.
- Owner moderation requires Basic Auth, same-origin check, and CSRF validation.
- Email reset endpoint returns a generic response to avoid email account enumeration.

## Validation
- `node scripts/check-js.js`: 170 JavaScript files lulus.
- Website automated tests: 21/21 lulus.
- Existing Designer Studio regression tests: 4/4 lulus.
- Full root test suite belum dapat dijalankan karena folder arsip tidak menyertakan `node_modules` dan environment build tidak memiliki dependensi terpasang; jalankan `npm ci` lalu `npm test` pada Windows.
