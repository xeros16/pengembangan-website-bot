# QA Report — PIR Visuals v5.82.0

## Release scope
Universal interaction reliability audit focused on clipboard actions, form feedback, duplicate-submit protection, and password confirmation UX. No database schema, authentication rules, WhatsApp bot logic, or transaction logic was changed.

## Automated website checks
- `npm run website:check`: PASS
- `npm run website:test`: 321 passed, 0 failed
- Server and model JavaScript syntax: PASS

## Real browser interaction fixture
Chromium headless executed the actual emitted `/public-ui.js` runtime extracted from `portfolio-website/server.js`.

Clipboard API was deliberately mocked to reject with `NotAllowedError`; `document.execCommand('copy')` was instrumented to confirm the selected text. Verified:
- One-time WhatsApp verification code copies through fallback and announces success.
- Customer support ticket copies through fallback and announces success.
- Public designer profile share copies the URL when native share is unavailable.
- Collection link copy works through the shared fallback.
- Shortlist link copy works through the shared fallback.
- No uncaught browser errors during these interactions.

Form behavior verified:
- A valid POST form receives `aria-busy`, `aria-disabled`, spinner and live status feedback.
- A second submit attempt is prevented.
- A form canceled by its existing `onsubmit` confirmation is not locked.
- GET forms are not affected by the POST submit guard.
- Password mismatch is invalid; matching confirmation restores validity.

## Preserved behavior
- Native share is still preferred when available.
- User cancellation of the native share sheet is not treated as a failure.
- Native HTML validation and server-side validation remain authoritative.
- Existing upload validation still runs before the shared submit feedback handler.
- Existing GSAP and magnetic mouse-following animation code is preserved.
- Light/dark theme tokens and navigation layout are unchanged.

## Full-project regression suite
- `npm run check`: PASS — 182 JavaScript files syntax-checked.
- `npm test`: 397 passed, 10 failed out of 407.
- The exact same 10 failures were reproduced against the untouched v5.81.0 baseline project before this update. They are in existing bot/backup expectations and were not introduced by v5.82.0:
  - backup validation / retention (2)
  - bot health / WhatsApp connection lifecycle (2)
  - WhatsApp designer setup token / OTP (2)
  - designer profile schema / formatting (2)
  - portfolio website route / command expectations (2)

## Protected files
`portfolio-website/models.js`, `.env`, database content, uploads/media, and WhatsApp session folders are not included in the update archives.
