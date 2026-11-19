# PIR Visuals v5.73.0 — QA & Regression Report

**Release:** 5.73.0  
**Website package:** 3.27.0  
**Base archive:** `pengembangan-bot-grup-desain.zip` provided in this conversation

## Automated checks

| Check | Result |
|---|---:|
| Root Node.js regression | 408/408 passed |
| Website regression | 242/242 passed |
| Root JavaScript syntax scan | 182 files passed |
| Website server/models syntax | Passed |
| Exact emitted `public-ui.js` parse test | Passed |

## Browser interaction QA

Chromium was used with the actual `pageShell()` output and the exact JavaScript emitted by the `public-ui.js` route. A representative selected-work filter was included to exercise the controller after initialization.

| Viewport | Menu | Lainnya | Theme | Escape/focus | Outside click | Work filter | JS errors |
|---|---|---|---|---|---|---|---|
| 320 × 600 | Pass | Pass | Pass | Pass | Pass | Pass | 0 |
| 360 × 700 | Pass | Pass | Pass | Pass | Pass | Pass | 0 |
| 390 × 844 | Pass | Pass | Pass | Pass | Pass | Pass | 0 |
| 400 × 497 | Pass | Pass | Pass | Pass | Pass | Pass | 0 |
| 430 × 932 | Pass | Pass | Pass | Pass | Pass | Pass | 0 |
| 768 × 900 | Pass | Pass | Pass | Pass | Pass | Pass | 0 |
| 1024 × 768 | Pass | Pass | Pass | Pass | Pass | Pass | 0 |
| 1180 × 820 | Pass | Pass | Pass | Pass | Pass | Pass | 0 |
| 1280 × 900 | Desktop nav visible | Pass | Pass | Pass | Pass | Pass | 0 |
| 1440 × 900 | Desktop nav visible | Pass | Pass | Pass | Pass | Pass | 0 |

Detailed machine-readable results: `docs/qa/NAVIGATION-INTERACTION-v5.73.0.json`.

## Scope and limitations

- The browser harness used the actual generated public shell and actual emitted UI script, but used a local representative body for the selected-work filter. It did not connect to the user's production MongoDB, SMTP provider, WhatsApp account, or deployment proxy.
- No live production deployment was changed from this workspace. The ZIP contains the source fix; the user still needs to deploy it and hard-refresh the browser.
- Bot logic and database behavior were not modified in this release. Root tests were refreshed where the provided archive contained stale assertions for retired backup, readiness, dashboard-linking, and profile-format patterns; no corresponding bot feature behavior was changed.
