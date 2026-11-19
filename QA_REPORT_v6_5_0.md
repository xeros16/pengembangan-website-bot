# PIR Visuals v6.5.0 — QA Report

## Scope

- Learning Cohort: create, role checks, group isolation, join, milestone, start, check-in, review, private progress, deletion confirmation.
- Designer Growth Insights: current vs previous 30-day activity windows.
- Media Format Explorer: metadata-only yt-dlp inspection, supported format filtering, bounded preset estimates, URL validation, MIME mapping.
- Command registry, guided workflows, website route, and additive database indexes.

## Automated results

The following counts are populated after the final verification run. They describe source-level tests only; they do not imply live WhatsApp/provider/database acceptance.

- Focused feature/registry/index + Command Explorer suite: **105/105 passed**.
- Website Command Explorer tests: **3/3 passed** (included in the focused suite).
- Root full suite: **632/634 passed**. Two test files cannot load because `mongoose` is not installed in this development environment (`designer-growth-v525.test.js`, `game-registry.test.js`).
- Website full suite: **409/410 passed**. The remaining `final-audit-v5.88.test.js` cannot load because `mongoose` is not installed in this development environment.
- JavaScript syntax check: **273 files passed**; `npm run website:check` passed.
- Release package audit: **passed** after removing the generated local runtime text file. ZIP integrity and two-part reconstruction are verified during packaging.

## Not covered by this environment

- Real WhatsApp group metadata, PN/LID mention resolution, and Baileys message delivery.
- Live MongoDB index creation, replica-set behavior, and deletion cleanup under concurrent writes.
- Live yt-dlp provider support, FFmpeg/FFprobe binaries, media payloads, and WhatsApp client codec acceptance.
- Real browser light/dark rendering, mobile layout, clipboard permissions, and CSP behavior on the deployment host.

## Release status

Development Candidate until full local dependency tests and target-host staging acceptance pass. Do not label Stable solely from unit tests or a ZIP integrity check.
