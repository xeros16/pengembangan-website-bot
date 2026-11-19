# PIR Visuals v5.71.0 — QA & Regression Report

**Release:** 5.71.0  
**Website package:** 3.25.0  
**Base:** v5.70.0  
**QA date:** 11 November 2026

## Automated regression

| Check | Result |
|---|---:|
| Root JavaScript syntax | 173 files passed |
| Root test suite | 387 / 387 passed |
| Website server/model syntax | Passed |
| Website test suite | 219 / 219 passed |
| New v5.71 tests | 7 / 7 passed |
| Browser fixture page errors | 0 |
| Browser fixture console errors | 0 |

## Browser interaction coverage

The new client-side interactions were exercised in Chromium using a deterministic component fixture that loads the actual generated `public-ui.js` and `studio-upload.js` code from `server.js`. The fixture is deliberately not represented as a live MongoDB-backed website session.

| Interaction | Desktop | Mobile |
|---|---|---|
| Designer Quick View opens, fills content, closes, restores focus | Passed | Passed |
| Light theme quick-view surface | Passed | — |
| Motion Off suppresses quick-view animation | Passed | — |
| Selected-work category filter | Passed | — |
| Selected-work keyword filter | Passed | — |
| Grouped gallery counter and captions | Passed | Passed |
| Gallery previous/next keyboard navigation | Passed | — |
| Gallery close and focus restoration | Passed | Passed |
| Analytics metric switching and bar recalculation | Passed | — |
| Upload preview for multiple files | Passed | — |
| Remove selected upload | Passed | — |
| Invalid file type rejection | Passed | — |
| No horizontal overflow at 390px viewport | — | Passed |

## Compatibility and data safety

- No new database models, schema fields, or migrations were added.
- Existing `/studio/work/upload` multipart POST contract is unchanged.
- Existing upload restrictions remain JPEG, PNG, WebP; maximum 8 MB per image; maximum five images. Client-side validation improves feedback but server-side validation remains authoritative.
- Existing designer profile, favorite, shortlist, collection, moderation, client project, WhatsApp, and bot routes remain in place.
- Lightbox uses same-origin `/media/...` links and keeps the link fallback when JavaScript is unavailable.
- Motion Off and `prefers-reduced-motion` are explicitly handled by the new interaction styles.
- Service worker cache advances to `pir-visuals-public-v17`; public UI, upload UI, PWA registration, and icon cache-busting use the v5710 token.

## Not covered by this automated run

A live deployment-specific check is still required for MongoDB connectivity, SMTP delivery, WhatsApp session state, and actual media upload persistence. These depend on the user's `.env`, database, file storage, and WhatsApp session. The ZIP does not replace or overwrite those local secrets and data.
