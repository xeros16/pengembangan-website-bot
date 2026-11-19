# QA Report — PIR Visuals v5.99.0

**Status:** Development Candidate; local acceptance required.  
**Baseline:** uploaded PIR Visuals v5.98.0 split source archives.

## Implemented

- Guided Designer Finder on `/discover`.
- Transparent designer-fit aggregation pipeline and match reason labels.
- Budget presets that reuse the existing price-range overlap filter.
- Private Portfolio Readiness checklist inside Designer Studio.
- Database count for all approved portfolio items and a separate case-study signal query.
- Responsive styles and theme-token integration.
- No schema migration and no new runtime dependency.

## Source-level verification

| Check | Result |
|---|---:|
| JavaScript syntax scan | 253 files passed |
| New v5.99 focused tests | 14/14 passed |
| Directory regression tests | 14/14 passed |
| Combined focused tests | 28/28 passed |

## Full suite results in this source-check environment

- Full website suite: **406/407 passed**. One legacy final-audit test file could not load because `mongoose` is not installed in this environment.
- Full root suite: **479/487 passed**. Eight legacy test files/subtests require `mongoose`, which is not installed in this environment.
- The missing-dependency failures are separate from the new v5.99 focused tests; all 28 focused tests passed.

## Not yet verified in this environment

- Live MongoDB execution of the fit aggregation pipeline.
- Actual rendered UI in desktop/mobile Chromium.
- Performance of the aggregation with production-sized designer collections.
- Real designer feedback on the readiness checklist and finder terminology.

## Manual acceptance checklist

- [ ] `npm ci` completes on local machine.
- [ ] `npm run website:install` completes.
- [ ] `npm run check` passes.
- [ ] `npm run website:check` passes.
- [ ] `npm run audit:release` passes.
- [ ] `npm test` passes.
- [ ] `npm run website:test` passes.
- [ ] `npm run test:e2e` passes on desktop and mobile Chromium.
- [ ] Guided finder returns plausible results on staging MongoDB.
- [ ] Profile readiness is private and consistent with approved portfolio data.
- [ ] Bot directory/contact behavior and WhatsApp pairing remain unchanged.
- [ ] Optional workspace remains optional and non-transactional.

## Release decision

Do not call v5.99.0 Stable until the local acceptance checklist is complete. Source-level unit tests do not replace MongoDB/browser/WhatsApp live verification.


## Release archive verification

- 609 source/project files are included across two complementary ZIP parts (306 in Part 1; 303 in Part 2).
- Both ZIP CRC checks pass and neither archive contains duplicate entries.
- Extracting both parts into one folder reconstructs every listed file with matching SHA-256.
- `.env`, `.git`, `node_modules`, WhatsApp auth/session, backups, uploads/media, and local runtime allowlists/settings are excluded.
- Compressed archive sizes: Part 1 6.02 MB; Part 2 6.06 MB.
