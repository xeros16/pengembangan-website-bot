# QA Report — PIR Visuals v5.97.0

## Release metadata

- Source files in clean split package: 599 across Part 1 (301 files) and Part 2 (298 files).

- Bot package: 5.97.0
- Website package: 3.44.0
- Product model: hybrid — bot directory/direct contact; website optional project workspace.

## Implemented test coverage

- Directory filter parsing and bounded pagination.
- Page clamping, result range calculations, and filter-preserving URLs.
- Budget range-overlap query expression and legacy single-price fallback.
- Invalid inverted budget handling.
- Relevance pipeline and newest sorting.
- Source assertions for filtered counts and page-size pagination.
- Source assertions for optional workspace disclosure and no PIR-mediated transactions.
- Source assertions for opt-in public availability and private calendar notes.
- Source assertions for accurate email/profile-review terminology.

## Environment validation

- `npm run check`: PASS — 241 JavaScript files.
- `npm run website:check`: PASS — website server, models, security, and directory utilities parse successfully.
- `npm run audit:release`: PASS — no forbidden secrets/session/backups/runtime data found in the release source tree.
- v5.97 directory/hybrid/trust/availability/index/bot-scope regression tests: PASS — 14/14.
- Website test suite: 386/387 PASS. The single blocked test file (`final-audit-v5.88.test.js`) cannot load because `portfolio-website/node_modules/mongoose` is missing in this environment. No other website assertions failed.
- Root test suite: 454/462 PASS; eight tests cannot load because `mongoose` is missing from root `node_modules`. No other root assertions failed.

## Pending local acceptance

- `npm ci` and `npm run website:install` on the user's local machine.
- Full `npm test` and `npm run website:test`.
- Live MongoDB query verification for `$expr` budget overlap and relevance aggregation.
- Browser E2E for pagination, filters, optional workspace, and public availability.
- Fresh WhatsApp account acceptance proving the bot remains directory-only.
- SMTP invitation test for the optional website workspace.
- Backup/restore drill for MongoDB and portfolio media.

## Release decision

**v5.97.0 is a development candidate, not Stable Release.** Promote only after all local acceptance items above pass and no critical/high severity regression remains.
