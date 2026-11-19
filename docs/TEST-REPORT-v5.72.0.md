# PIR Visuals v5.72.0 — QA & Regression Report

**Release:** 5.72.0  
**Website package:** 3.26.0  
**Base:** v5.71.0  
**QA date:** 11 November 2026

## Automated regression

| Check | Result |
|---|---:|
| Root JavaScript syntax | 173 files passed |
| Root test suite | 387 / 387 passed |
| Website server/model syntax | Passed |
| Website test suite | 233 / 233 passed |
| Navigation restoration tests | 8 / 8 passed |
| Motion restoration tests | 6 / 6 passed |
| CSS top-level parser errors | 0 |
| ZIP central directory / CRC | Valid after packaging |

## Browser interaction coverage

Chromium interaction QA used the page-shell navigation CSS, actual header markup, and the generated public UI controller from the release source.

| Viewport | Closed submenu hidden | Utility actions hit-testable | Open submenu actions reachable | Keyboard / focus | Overflow |
|---|---|---|---|---|---|
| 320 × 600 | Pass | 4 / 4 | Pass | Pass | None |
| 360 × 700 | Pass | 4 / 4 | Pass | Pass | None |
| 390 × 844 | Pass | 4 / 4 | Pass | Pass | None |
| 400 × 497 | Pass | 4 / 4 | Pass | Pass | None |
| 430 × 932 | Pass | 4 / 4 | Pass | Pass | None |
| 768 × 900 | Pass | 4 / 4 | Pass | Pass | None |
| 1024 × 768 | Pass | 4 / 4 | Pass | Pass | None |
| 1180 × 820 | Pass | 4 / 4 | Pass | Pass | None |
| 1280 × 900 | Pass | 4 / 4 | Pass | Pass | None |
| 1440 × 900 | Pass | 4 / 4 | Pass | Pass | None |

Additional browser checks: `Lainnya` updates `aria-expanded`; Escape closes the submenu and restores focus; a second Escape closes compact navigation and restores focus to Menu; quick search opens; the theme toggle changes theme; no page errors or console errors were observed.

Recorded results: `docs/qa/NAVIGATION-RESULTS-v5.72.0.json`.

## Navigation text contrast

Measured with Chromium after each theme had settled (WCAG AA requires 4.5:1 for normal text):

| Control | Dark mode | Light mode |
|---|---:|---:|
| Portal desainer | 10.15:1 | 10.15:1 |
| Cari | 10.90:1 | 8.11:1 |
| Motion | 10.90:1 | 9.97:1 |
| Tema | 10.90:1 | 9.64:1 |

Recorded computed colors and ratios: `docs/qa/NAVIGATION-CONTRAST-v5.72.0.json`.

## Source integrity and packaging

- Every source file present in the v5.70.0 base archive remains in v5.72.0: **0 removed**.
- The v5.71 archive had included generated `node_modules` and root-level QA fixtures/screenshots; those are excluded from the clean v5.72 source archive.
- Package manifests and lockfile are retained so dependencies can be installed reproducibly.
- Existing Designer Studio, Portfolio, Collection/Moodboard, Client Workspace, authentication, moderation, upload, WhatsApp, bot, and game code is retained.
- No database schema, migration, authentication contract, upload endpoint, WhatsApp session, bot command, or game behavior change.

## Not covered by this automated run

Live MongoDB connectivity, SMTP delivery, WhatsApp session state, and persistent media upload still require verification in the user's local environment. The final ZIP was extracted into a clean folder and the same syntax checks plus all 387 root and 233 website tests were rerun successfully. The ZIP does not overwrite local secrets, sessions, database records, or user uploads.
