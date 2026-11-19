# PinSearch Fix v5.4.1

## Root cause
The uploaded v5.4.0 source explicitly implemented `.pinsearch` as link-only. It did not call Pinterest, download image files, or send image media. That is why it could not provide a picture.

## New behavior
- `.pinsearch <keyword> [1-5]` uses Pinterest API v5 search pins.
- Images are taken from each returned pin's `media.images`, downloaded, validated, and sent as WhatsApp image media with the source pin URL.
- Missing token or API errors produce a clear message and the manual search URL. No placeholder image and no silent fallback to Bing.
- `.bingsearch` stays independent.

## Setup
1. Copy `.env.example` settings into your existing `.env` (do not replace your existing `.env`).
2. Add `PINTEREST_ACCESS_TOKEN=<your authorized Pinterest API token>` to `.env`. The app must have API access and the `pins:read` scope.
3. Restart the bot.
4. Test `.pinsearch Yae Miko 3`.

If no token is configured, image sending cannot work; the bot intentionally reports this rather than pretending it found an image. HTTP 401 means token invalid/expired; 403 means API permission/access denied; 429 means rate limit.

## Patch files
- `features/commands/pinterest-search.js`
- `tests/pinterest-search.test.js`
- `.env.example`
- `package.json` and `package-lock.json` (version 5.4.1)
- `CHANGELOG.md`

Unit tests use mocked API responses. A real Pinterest API token and live WhatsApp test are still required to verify end-to-end delivery.
