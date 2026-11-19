# PIR Visuals v5.39.0 — Premium Identity & Shared Account Platform

## Premium UI/UX and pear brand
- Replaced the previous generic green/blue visual styling with a coordinated pear-inspired palette based on the exact supplied circular pear SVG.
- Updated the actual `/icon.svg` response, favicon cache-busting, PWA manifest theme, and service-worker cache version.
- Added a subtle pear emblem watermark to the homepage hero.
- Reworked typography, navigation, cards, buttons, forms, labels, secondary text, borders, and responsive layouts with contrast-aware dark and light theme tokens.
- Public designer portfolio and authenticated Designer Studio headers use the account's display name and HTTPS avatar; general public pages retain PIR VISUALS branding.

## Shared WhatsApp + website data
- The website runs as a separate process but connects to the same `MONGO_URI` as the WhatsApp bot.
- Both processes use the same MongoDB collections for `DesignerProfile` and `PortfolioItem`.
- A designer profile created with `.portfolio daftar` is immediately available to the website directory because both processes read the same `designerprofiles` collection.
- Website registration creates a short-lived, one-time pending signup request. The WhatsApp bot verifies the phone number and links it to the existing profile or creates a profile for a website-first signup.
- Dashboard credentials are stored in the shared `designerdashboardauth` collection. Passwords use the website's scrypt hash format.
- Bot OTP uses SHA-256 token hashing, is private-chat only, expires after 10 minutes, and is consumed by the existing website login flow.
- Email verification remains required before Designer Studio login.

## Manual-only portfolio image upload
- `.portfolio add` no longer accepts or downloads portfolio images through WhatsApp.
- The bot directs designers to the website's Designer Studio.
- Portfolio images must be uploaded manually through the website. This avoids automatic WhatsApp media mirroring.
- Existing approved/pending portfolio items remain in the shared MongoDB collection.

## Runtime
- Root `.env` is loaded by the website process. `MONGO_URI` must be the same URI used by the bot.
- `BOT_DATA_ROOT` defaults to the project root; `PORTFOLIO_UPLOAD_DIR` is shared with the bot.
- Website and bot remain separate processes. Start the bot with `npm start`; install/start the website with `npm run website:install` then `npm run website`, or use `START-WEBSITE.bat`.
- SMTP variables and `PORTFOLIO_PUBLIC_BASE_URL` are required for email verification and password recovery.

## Security notes
- Website signup code expires after 30 minutes, is stored only as a hash, and can be used once.
- The bot compares the signup's E.164 number with the actual WhatsApp phone JID aliases before linking.
- Linking requires membership in an allowed design community group.
- OTP is only sent in a private chat and expires after 10 minutes.
- Email verification and existing website session/CSRF protections remain active.

## Validation
- Bot JavaScript syntax check passes.
- Bot suite: 386 tests pass.
- Website suite: 52 tests pass.
- Website and bot integration tests cover shared collection names, phone-bound linking, OTP, manual-only upload, and shared storage paths.
- Live MongoDB, SMTP, Cloudflare Tunnel, and browser/device visual QA must be completed in the deployment environment.


## Patch v5.39.1 — Contrast and SMTP
- Removed duplicate `expiresAt` schema index declarations from the signup request model. The TTL index remains in place.
- Dark mode now uses graphite/charcoal surfaces with restrained sage accents instead of green-tinted surfaces.
- Light mode enforces readable text, labels, form controls, cards, and explicit high-contrast Portal Desainer navigation.
- Removed the decorative center watermark from the homepage hero.
- Added Gmail SMTP setup instructions and a ready-to-edit `.env.example` block.
