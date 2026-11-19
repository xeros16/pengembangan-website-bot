# QA Report — PIR Visuals v6.5.1

## Release metadata
- Bot package: `6.5.1`
- Website package: `3.48.1`
- Runtime dependency changes: none
- Database migration: none; existing Learning Cohort fields become nullable before start, and legacy milestone offsets are reconstructed when an open cohort is started.

## Source and focused checks
- JavaScript syntax scan: **274 files passed**.
- Focused bot/registry/index/privacy/media suite: **90/90 passed**.
- Website Command Explorer + visual-system tests: **8/8 passed**.
- `npm run website:check`: passed.
- `npm run audit:release`: passed after removing the test-generated local `content/texts.json` runtime file.
- Generated command catalog: refreshed from the current command registry.

## Full test suites
- Root `npm test`: **635/637 passed**. Two test files could not load because `mongoose` is not installed in this build environment (`tests/designer-growth-v525.test.js`, `tests/game-registry.test.js`). The affected assertions did not execute.
- Website `npm run website:test`: **414/415 passed**. One integration test could not load because `mongoose` is not installed (`portfolio-website/tests/final-audit-v5.88.test.js`). The affected assertions did not execute.
- Install dependencies with `npm ci` and `npm ci --prefix portfolio-website`, then rerun both complete suites before production acceptance.

## Feature regression coverage
- Cohort registration does not expire before facilitator start.
- Cohort duration and milestone deadlines are calculated from actual start time.
- Legacy v6.5.0 milestone day offsets are preserved when an old open cohort starts.
- Former participants retain access only to their own history and can delete their own check-ins after leaving; their records are excluded from active review queues and active-member aggregate counts.
- Group boundaries and facilitator permission checks remain enforced.
- Downloader rejects additional private/reserved IPv4 and IPv6 literals and common private host suffixes.
- Media Format Explorer remains metadata-only, rate-limited, and concurrency-bounded.
- Command Explorer filters commands and workflows, reports counts, and has a no-results state.
- Visual stylesheet is served same-origin and has semantic theme tokens, sparse background motif, separated mobile navigation actions, focus and reduced-motion rules, plus static 4.5:1 WCAG AA contrast checks for key semantic token pairs.

## Staging still required
- Live WhatsApp/Baileys PN/LID mention normalization and group permission acceptance.
- MongoDB read/write validation against a staging backup.
- DNS rebinding and provider redirect protection through deployment outbound firewall/egress policy. URL validation alone cannot enforce network isolation.
- Real yt-dlp provider, FFmpeg/FFprobe, and WhatsApp media-send acceptance.
- Actual desktop/mobile browser rendering in Light and Dark Mode. The current build environment did not complete a Chromium headless screenshot, so source-level visual tests are not a substitute for browser acceptance.
- Backup/restore rehearsal and documented rollback before Stable.

## Release status
**Development Candidate — not Stable.** Source-level focused checks and release audit pass. Complete dependency-backed suites and live staging remain mandatory.
