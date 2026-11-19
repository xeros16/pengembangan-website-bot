# QA Report — PIR Visuals v6.6.0

- Bot package: `6.6.0`
- Website package: `3.49.0`
- Release status: Development Candidate; live staging acceptance is still required.

## Source and syntax checks

- `npm run check`: passed; 278 JavaScript files passed syntax validation.
- `npm run website:check`: passed.
- `node scripts/generate-command-docs.js`: passed; `docs/commands.md` and `docs/commands.json` regenerated from the active registry.
- `npm run audit:release`: passed after removing test-generated `content/texts.json` from the working tree.

## Focused feature tests

- Bot feature/registry/index suite: 106/106 passed.
- Website Creative Studio + Command Explorer suite: 5/5 passed.
- Coverage includes:
  - Creative Asset URL validation, private-by-default storage, explicit sharing, owner-only access changes, group isolation, Admin moderation, and hidden-record privacy.
  - Design Season Admin permission, 2-round minimum, one active season/round behavior, group isolation, submissions, peer review, review freeze, hidden-entry resubmission prevention, final results, and expired final-round reconciliation.
  - Design Season and Creative Asset model/index declarations, additive index setup, and database verifier requirements.
  - Image dimension guard and output limits, Music Top chart parsing, command routing/catalog/search, and public website route/navigation/theme behavior.

## Full suite results in this environment

- Root `npm test`: 648/650 passed. Two test files could not load because `mongoose` is not installed in this build environment (`tests/designer-growth-v525.test.js` and `tests/game-registry.test.js`).
- Website `npm run website:test`: 416/417 passed. One test file could not load because `mongoose` is not installed (`portfolio-website/tests/final-audit-v5.88.test.js`).
- The failing files stop during module loading before their test assertions execute. The environment also does not include the Sharp package/native runtime needed for full media processing; a caught optional color-palette preview path logs this missing dependency during the root suite.

## Database changes

Three additive collections and index groups are included:

- `designseasons`: unique code, one active season per group (partial unique index), group/status listing.
- `designseasonsubmissions`: unique code, one participant entry per round, group/round gallery index.
- `creativeassets`: unique group-scoped asset code, group visibility/category index, owner collection index.

No existing collection is dropped and no destructive migration is introduced. Run `npm run db:ensure-shared-indexes` and `npm run verify:database` on staging before enabling these commands.

## Not yet verified on production-like staging

- Real MongoDB index creation and duplicate-data behavior.
- WhatsApp Admin/participant flows, Baileys media attachment behavior, sticker output size, and animated sticker processing with installed FFmpeg/Sharp.
- Apple Indonesia RSS live availability and 429/network behavior.
- Desktop/mobile browser rendering of `/creative-studio` in both Light and Dark Mode.
- Backup/restore and rollback drill after the additive collections are created.

Do not label this release Stable until these checks pass on the deployment environment.
