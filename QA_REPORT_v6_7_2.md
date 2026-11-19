# QA Report — PIR Visuals v6.7.2

- Bot package: `6.7.2`
- Website package: `3.50.0`
- Release status: Development Candidate; live staging acceptance is still required.

## Source and syntax checks

- `npm run check`: passed; 282 JavaScript files passed syntax validation.
- `npm run website:check`: passed.
- `npm run docs:commands`: passed; `docs/commands.md` and `docs/commands.json` regenerated from the active registry.
- `npm run audit:release`: passed after removing test-generated `content/texts.json`; no credentials, auth sessions, backups, subscription data, or temporary runtime files were found.

## Focused feature and regression tests

- **93/93 passed** across Voice Lab, Local Information, command catalog, command search, command routing, general help/menu/workflows, navigation, and operational metadata.
- Website Command Explorer + Creative Studio page tests: **5/5 passed**.
- Local FFmpeg filter smoke test: **37 unique filter profiles passed** against a generated stereo audio sample.
- Voice Lab coverage includes fixed filter profiles, alias resolution, tempo bounds, quoted audio handling, mocked MP3 delivery, input-size rejection, missing-FFmpeg diagnostics, temporary-file cleanup, and two-job concurrency cap.
- Local Information coverage includes city geocoding, weather formatting, cache behavior, missing-city handling, BMKG earthquake formatting, and provider failure handling.
- Generated catalog: **230 top-level command names**, **24 categories**, **9 workflows**.

## Full suite results in this environment

- Root `npm test`: **683/685 passed**. Two test files could not load because `mongoose` is not installed in this build environment:
  - `tests/designer-growth-v525.test.js`
  - `tests/game-registry.test.js`
- Website `npm run test --prefix portfolio-website`: **416/417 passed**. One test file could not load because `mongoose` is not installed:
  - `portfolio-website/tests/final-audit-v5.88.test.js`
- These three failures occur during module loading before assertions execute. Install declared dependencies (`npm ci` and `npm ci --prefix portfolio-website`) and rerun both full suites in staging.

## Database changes

No new MongoDB collection, index, or destructive migration is introduced in v6.7.2. Existing collections and indexes remain unchanged.

## Not yet verified on production-like staging

- Real Baileys quoted voice-note/audio-document retrieval and MP3 delivery on Android/iOS WhatsApp clients.
- FFmpeg availability and resource use on the production host.
- Live Open-Meteo geocoding/forecast and BMKG earthquake-feed availability from the production network.
- Browser visual acceptance of Creative Studio and Command Explorer on desktop/mobile in Light and Dark Mode.
- Backup/restore and rollback drill in the deployment environment.

Do not label this release Stable until dependency-complete suites and live staging checks pass.
