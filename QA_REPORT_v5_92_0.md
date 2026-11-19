# QA Report — PIR Visuals Bot v5.92.0

## Release scope

This release improves design learning and community participation. It does not change the v5.91.0 portfolio directory's direct-contact-only business model. No payment, order, offer, commission, escrow, transaction mediation, or cross-group portfolio publication is introduced. Website runtime code is unchanged.

## Implemented changes

- Added a 12-module Learning Path across three levels and four topics.
- Saved active module, completion list, short completion notes, and timestamps in `User.preferences.learningProgress`.
- Added path overview, progress summary, next-module navigation, and explicit reset confirmation.
- Preserved legacy `.designlearn <level> [topic]` usage and allowed reading lessons while MongoDB is offline.
- Changed daily/weekly challenge date calculation to Asia/Jakarta (WIB).
- Added group-scoped challenge submissions, gallery, personal participation summary, contributor board, and peer feedback.
- Submissions accept a valid HTTPS link or an image posted with the command in the group.
- Prevented self-review and duplicate peer feedback; feedback requires a minimum 12-character comment.
- Added group-admin/Owner hide/restore moderation, with internal moderation notes.
- Added `LearningSubmission` model, unique submission code, compound group/challenge/member uniqueness, and gallery lookup index.
- Added two editable tutorial keys, updated both content JSON files, refreshed onboarding examples, and updated command catalog/documentation.
- Updated 17 website regression fixtures to track the root bot version 5.92.0 while keeping the website's own version/cache contract unchanged.

## Automated validation

| Check | Result |
|---|---:|
| `npm run check` | PASS — 225 JavaScript files syntax-checked |
| `npm run website:check` | PASS |
| `npm run audit:release` | PASS |
| Focused tests (`design-learning`, `content-editor`, `operational-stability`) | PASS — 37/37 |
| `npm test` | 401/409 passed; 8 test modules could not load because `mongoose` is not installed in this workspace |
| `npm run website:test` | 372/373 passed; `final-audit-v5.88.test.js` could not load because its model/server integration requires `mongoose` |
| `npm run docs:commands` | Blocked by the same missing `mongoose` dependency; `docs/commands.md` was updated manually |

The 8 bot-suite test modules blocked by the missing package are:
- `tests/command-catalog.test.js`
- `tests/command-routing.test.js`
- `tests/command-search.test.js`
- `tests/command-suggestions.test.js`
- `tests/designer-growth-v525.test.js`
- `tests/game-registry.test.js`
- `tests/general-help.test.js`
- one dynamic command-catalog test in `tests/menu-designer.test.js`

These are dependency-load failures (`ERR_MODULE_NOT_FOUND: mongoose`), not assertion failures in the executed test cases. The npm install attempt did not complete in this execution environment, so the missing package was not silently mocked.

## Release archive

- Source is split into two ZIP archives for download.
- Both ZIP files passed CRC/integrity checks.
- Extracting both parts into the same directory reconstructed every packaged file byte-for-byte using SHA-256 verification.
- `.env`, `.git`, `node_modules`, WhatsApp auth/session state, backups, runtime uploads, and temporary files are excluded.
- A release manifest lists each included file's SHA-256 and byte size.

## Not verified in this environment

- WhatsApp live delivery, image-caption parsing across Android/iOS/Web clients, and actual group admin metadata behavior.
- MongoDB staging reads/writes, index creation for `LearningSubmission`, and concurrent upsert behavior under live traffic.
- Backup/restore of the new collection on the production database.
- Real-user comprehension of the 12-module curriculum and peer-review guidelines.
- Whether the group uses moderation commands consistently.
- No live AI evaluation or artwork-hosting behavior is claimed.

## Required staging smoke tests

1. `.designlearn jalur` shows 12 modules.
2. Start progress as two different test accounts and verify that their progress is isolated.
3. Complete one module, verify duplicate completion is idempotent, and confirm `.designlearn lanjut` advances only after completion.
4. Test lesson reading while MongoDB is unavailable; confirm progress is not falsely reported as saved.
5. Check daily challenge changes at 00:00 WIB and weekly challenge changes on the WIB-based ISO week boundary.
6. Submit an HTTPS work link and an image with a command caption.
7. Verify gallery results are visible only in the originating group.
8. Verify self-feedback and duplicate feedback are rejected.
9. Verify group Admin can hide/restore an entry; ordinary members cannot.
10. Verify gallery output never exposes internal JIDs or phone numbers.
11. Verify challenge submissions never appear automatically in the public Designer Portfolio Directory.

## Release decision

**Source syntax, focused learning tests, release audit, and package integrity: PASS. Full-suite and production readiness: CONDITIONAL.**

Install dependencies with `npm ci` in a network-enabled deployment/staging environment, rerun the complete suites, then execute the live WhatsApp/MongoDB smoke tests before production rollout.
