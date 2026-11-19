# QA Report — PIR Visuals Bot v6.4.0

## Scope
Core PIR: Designer contribution summary, group-scoped time-limited Design Battle, public Command Explorer, and group moderation status/presets. General feature: downloader retry, status/cancel, FFprobe metadata, and MIME safety.

## Focused automated checks
- Design Battle: Admin permissions, duration/category validation, one-open-battle-per-group index, creation, one-entry-per-user model key, one open battle per group, expired-event cleanup, group-scoped gallery, feedback freeze at closure, late-entry rejection, resubmission score reset, and hidden-entry moderation bypass prevention.
- Contribution summary: current-group scope, personal-only output, mentor opt-in status, and no JID disclosure.
- Moderation: read-only status, preview does not write, apply requires same-admin five-minute preview plus explicit confirmation, stale-snapshot rejection, non-admin rejection, and unrelated settings preserved.
- Downloader: one retry for network/429 only, no retry for 403/unsupported (yt-dlp internal retries disabled), Pinterest fallback restricted to unsupported public Pinterest formats, abortable backoff, active requester cancellation, FFprobe parsing, and MIME mapping.
- Command Explorer: generated JSON matches runtime command registry, search/filter route, copy-example interaction, navigation link.
- Database: DesignBattle schema, command dependency injection, additive index setup, and verifier coverage.

## Current source checks
- JavaScript syntax scan: 270 files passed.
- Focused feature/registry/index suite: 92/92 passed.
- Command Explorer tests: 3/3 passed.
- `npm run website:check`: passed.
- `npm run audit:release`: passed.
- Root `npm test`: 610/612 passed; two test files could not load because `mongoose` is not installed in this environment.
- Website `npm run website:test`: 409/410 passed; one integration test could not load because `mongoose` is not installed.
- These are dependency-load failures before the affected test assertions execute; install with `npm ci` and `npm ci --prefix portfolio-website` before certifying the full suites.

## Known validation boundary
- Live WhatsApp/Baileys delivery, MongoDB index creation and real group permissions, yt-dlp/FFmpeg/FFprobe behavior, and browser rendering of `/commands` require staging.
- Because `mongoose` is not installed in this development environment, the listed full-suite test files fail at module loading before their assertions execute. Install dependencies with `npm ci` and `npm ci --prefix portfolio-website` before certifying the full suites.
- No production-stable claim is made until staging acceptance and rollback are verified.
