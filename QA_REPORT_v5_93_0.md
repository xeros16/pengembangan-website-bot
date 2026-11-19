# QA Report — PIR Visuals Bot v5.93.0

## Release scope

v5.93.0 adds the group-scoped Community Hub on top of v5.92.0 Learning Path & Community Challenge. Website runtime, website package version, and public asset cache version are unchanged.

## Implemented changes

- Added `.designcommunity` command and router integration.
- Added explicit opt-in mentor and learner profiles scoped by `{ groupJid, userJid }`.
- Added two-way mentor/learner discovery limited to visible, opted-in profiles and the current group.
- Added profile introduction, opt-out, and delete controls.
- Added personal participation milestones derived from learning progress, challenge submissions, peer reviews, collaboration participation, and mentor opt-in.
- Added group-scoped collaboration board: create, list, join, leave, close.
- Added project capacity 2–5 including owner, max three open projects per owner/group, unique short codes, and owner/Admin close permission.
- Added atomic MongoDB capacity condition to join operation.
- Added validation to reject unknown skills, excessive skill selections, phone/JID/URL contact details in public intro and project brief, and invalid project fields.
- Added `CommunityProfile` and `CommunityCollaboration` models and lookup/uniqueness indexes.
- Added help/tutorial, onboarding, natural-language search, command catalog, README, roadmap, changelog, install guide, and runbook updates.

## Automated validation

| Check | Result |
|---|---:|
| `npm run check` | PASS — 227 JavaScript files syntax-checked |
| `npm run website:check` | PASS |
| `npm run audit:release` | PASS |
| Focused tests (`design-community`, `design-learning`, `content-editor`, `operational-stability-v587`, `onboarding`) | PASS — 61/61 |
| `npm test` | 413/421 passed; 8 test entries could not load because `mongoose` is not installed in this workspace |
| `npm run website:test` | 372/373 passed; `final-audit-v5.88.test.js` could not load because `mongoose` is not installed in this workspace |
| `npm run docs:commands` | Not run successfully; command catalog imports game registry, which imports the missing `mongoose` dependency. `docs/commands.md` was updated manually for the new command and count. |

The eight blocked bot test entries are:
- `tests/command-catalog.test.js`
- `tests/command-routing.test.js`
- `tests/command-search.test.js`
- `tests/command-suggestions.test.js`
- `tests/designer-growth-v525.test.js`
- `tests/game-registry.test.js`
- `tests/general-help.test.js`
- One command-catalog subtest in `tests/menu-designer.test.js`

These entries fail during module loading with `ERR_MODULE_NOT_FOUND: mongoose`; they do not represent failed assertions in executed test bodies. The isolated Community Hub suite passed all eleven tests, and the combined focused suites passed 61/61.

## Release archive

- Source is distributed as two complementary ZIP archives: `PIR-Visuals-v5.93.0-Community-Hub-Part-1.zip` and `PIR-Visuals-v5.93.0-Community-Hub-Part-2.zip`.
- The two archives contain 544 project files total (274 in Part 1 and 270 in Part 2), plus repeated package instructions, parts guide, and SHA-256 manifest.
- Part 1 compressed size: 5.46 MB; Part 2 compressed size: 6.48 MB.
- Both ZIPs passed CRC/integrity checks and contain no duplicate archive entries.
- Extracting both archives into the same folder reconstructed every source file byte-for-byte with SHA-256 verification.
- `.env`, `.git`, `node_modules`, WhatsApp auth/session state, backups, uploads, logs, and temporary files are excluded.

## Not verified in this environment

- Mongoose schema/index creation against a live MongoDB deployment.
- Concurrent joins against a real MongoDB server and multi-instance bot deployment.
- Actual WhatsApp group metadata behavior for Admin close permission.
- Real-member comprehension of mentor opt-in, project brief, role expectations, deadlines, attribution, and intellectual-property boundaries.
- Backup/restore of the two new collections on production data.

## Required staging smoke tests

1. Opt in as a mentor in group A and verify search in group A.
2. Search the same skill in group B and verify group A profile is not returned.
3. Enable learner profile, update intro, opt out, and verify the profile disappears from discovery.
4. Delete the profile and verify deletion is scoped to the current group.
5. Seed learning/challenge data and verify milestone thresholds.
6. Create a project with capacity two and confirm owner occupies one slot.
7. Test duplicate join, self-join, cross-group join, full capacity, and a join after project closure.
8. Verify only owner/Admin can close a project.
9. Verify phone/JID/URL contact details are rejected from mentor intro and collaboration brief.
10. Verify formatted output contains no stored JIDs or phone numbers.
11. Disconnect MongoDB and verify no profile/project mutation reports success.
12. Verify new collections are included in scheduled backups and can be restored in staging.

## Release decision

**Source syntax, focused tests, website syntax, and release audit: PASS. Full-suite and production readiness: CONDITIONAL.**

Install dependencies with `npm ci` in a network-enabled staging/deployment environment, rerun the complete suites, verify Mongoose indexes, and complete live WhatsApp/MongoDB smoke tests before production rollout.
