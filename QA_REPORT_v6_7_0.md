# QA Report — PIR Visuals v6.7.0

- Bot package: `6.7.0`
- Website package: `3.50.0`
- Release status: Development Candidate; live staging acceptance is still required.

## Source and syntax checks

- `npm run check`: passed; 278 JavaScript files passed syntax validation.
- `npm run website:check`: passed.
- `npm run docs:commands`: passed; `docs/commands.md` and `docs/commands.json` regenerated from the active registry.
- `npm run audit:release`: passed after removing test-generated `content/texts.json`; no forbidden credentials, sessions, backups, subscription data, or temporary files were found.

## Focused feature tests

- Bot feature/registry/search suite: **103/103 passed**.
- Website Command Explorer + Creative Studio suite: **5/5 passed**.
- Additional menu and operational metadata regression tests: **13/13 passed**.
- Coverage includes:
  - `.fitur` category counts, natural-language search, category navigation, pagination, workflow list/detail, custom-prefix behavior, command registry routing, and website primary navigation.
  - Jikan primary requests, AniList fallback for search/popular/seasonal, normalized score/title/studio output, provider attribution, safe-for-work filtering, and useful combined-provider error diagnostics.
  - Apple Music single-song URL parsing, official iTunes Lookup resolution, preview audio send, no-preview handling, album-only rejection, Apple CDN allowlisting, manual redirect revalidation, content-type and size limits, and `.dl` routing.
  - Generated command catalog includes `.fitur`, `.features`, `.jelajah`, and the Apple Music preview workflow.

## Full suite results in this environment

- Root `npm test`: **659/661 passed**. Two test files could not load because `mongoose` is not installed in this build environment:
  - `tests/designer-growth-v525.test.js`
  - `tests/game-registry.test.js`
- Website `npm run website:test`: **416/417 passed**. One test file could not load because `mongoose` is not installed:
  - `portfolio-website/tests/final-audit-v5.88.test.js`
- These three failures stop during module loading before assertions execute. Install the declared dependencies (`npm ci` and `npm ci --prefix portfolio-website`) and rerun the full suites in staging.

## Database changes

No new MongoDB collection, index, or destructive migration is introduced in v6.7.0. Existing v6.6.0 collections and indexes remain unchanged.

## Not yet verified on production-like staging

- Real Jikan and AniList availability, rate limits, and network fallback from the production host.
- Apple's live iTunes Lookup responses and current availability of `previewUrl` for individual tracks.
- Baileys audio attachment delivery on real WhatsApp clients and actual preview file metadata.
- Browser visual acceptance of primary navigation on desktop/mobile in Light and Dark Mode.
- Backup/restore and rollback drill in the deployment environment.

Do not label this release Stable until the dependency-complete suites and live staging checks pass.
