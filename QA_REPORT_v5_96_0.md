# QA Report — PIR Visuals v5.96.0

## Scope

Website ↔ bot data integration, contact-field compatibility, Designer Studio notification inbox, shared environment diagnostics, database verification tooling, deployment smoke tooling, command permissions, user onboarding, deployment/recovery documentation.

## Implemented and source-verified

- Bot and website share the `designerprofiles` and `portfolioitems` collection contracts.
- Bot profile creation/edit writes both `publicWhatsApp` and `contactPhone`.
- Website profile edit writes both aliases.
- Website public portfolio CTA resolves either contact field and uses a tracked redirect that opens the designer's WhatsApp directly.
- Bot profile/portfolio schemas preserve website-owned profile and case-study fields (`strict: false`).
- Bot analytics schema preserves website daily `portfolioViews` and `serviceViews`.
- Bot reads website `designernotifications` only in private chat; every query/update is scoped to the linked `designerId`.
- `.studio` now reads website services, public collections, verified testimonials, upcoming availability, new leads and active project-room counts without exposing client names, emails, phone numbers, briefs or message history.
- Notification rendering sanitizes control characters and limits untrusted text.
- Integration doctor mirrors root-first dotenv loading and compares MongoDB host, port and database without printing credentials.
- Deployment smoke checker validates bot `/ready` and website `/health`.
- Database verifier inspects shared collections and required index names without mutating the database; it now checks for `MONGO_URI` and a missing `mongoose` dependency gracefully before attempting a connection.
- Added end-user guide, install guide, operations/recovery runbook, and a real-staging acceptance checklist.
- Bot package version 5.96.0; website package version 3.43.0; website health endpoint reports platform release 5.96.0.

## Automated checks run

| Check | Result |
|---|---:|
| `npm run check` | PASS — 236 JavaScript files syntax-checked |
| `npm run website:check` | PASS |
| `npm run audit:release` | PASS |
| Focused integration/onboarding tests | PASS — 57/57 |
| Command permissions (support, community, marketplace, access control) | PASS — 76/76 |
| Full bot test suite | 451/459 passed; 8 blocked by missing `mongoose` |
| Full website test suite | 372/373 passed; 1 blocked by missing `mongoose` |
| `npm ci` (root and website) | BLOCKED — npm registry DNS `EAI_AGAIN registry.npmjs.org`; no dependencies installed |
| `npm run integration:doctor` | Ran; correctly reports missing `.env`/`MONGO_URI`, public domain, dashboard credentials, SMTP, dependencies and `AUTH_DIR` in this workspace |
| `npm run smoke:deployment` | 0/2 — bot and website staging processes are not running here |
| `npm run verify:database` | Cleanly reports missing root `MONGO_URI` before loading mongoose; 4 verifier unit tests pass |
| `npm run docs:commands` | BLOCKED — imports the command registry which requires `mongoose`; `docs/commands.md` updated manually |

### Bot suite modules blocked by missing `mongoose`

- `tests/command-catalog.test.js`
- `tests/command-routing.test.js`
- `tests/command-search.test.js`
- `tests/command-suggestions.test.js`
- `tests/designer-growth-v525.test.js`
- `tests/game-registry.test.js`
- `tests/general-help.test.js`
- One command-catalog subtest in `tests/menu-designer.test.js`

### Website suite module blocked by missing `mongoose`

- `portfolio-website/tests/final-audit-v5.88.test.js`

All 8 bot-suite failures and the 1 website-suite failure are dependency-load errors (`ERR_MODULE_NOT_FOUND: mongoose`), not failed assertions. The 57 focused integration/onboarding/database-verifier tests and 76 permission/support/community tests pass. Root and website dependency installation both failed because DNS resolution for `registry.npmjs.org` returned `EAI_AGAIN`; no fake/stub Mongoose package was substituted and neither dependency tree was populated. A GitHub Actions workflow was added so the complete suites can run on a network-enabled hosted runner after the source is pushed to a repository.

## Release archive verification

- 568 project files are included in the rebuilt v5.96.0 source archives, including the CI workflow, staging access requirements, and verifier regression tests.
- Part 1 contains 286 source files; Part 2 contains 282 source files.
- Both ZIP CRC checks pass; no duplicate entries were found.
- Extracting both parts together reconstructs every listed source file with matching SHA-256.
- `.env`, `.git`, `node_modules`, WhatsApp auth/session state, backups, uploads and local runtime allowlists/settings are excluded.

## Live environment limitations

- No project `.env` is present in this workspace; `integration:doctor` reports 3 OK, 5 warnings and 1 error (missing `MONGO_URI`).
- No live MongoDB endpoint or credentials were supplied; shared collection and index checks were not executed.
- No bot/website processes were running; deployment HTTP health checks could not pass.
- `mongodump`, `mongorestore`, and `mongosh` are not installed; a database restore drill was not performed.
- No WhatsApp authentication session is available; account linking, group Admin metadata, and private notification delivery were not tested against a live WhatsApp account.
- No hosting/SSH session or connected GitHub repository is available in this project context; the CI workflow has been authored but not triggered.

## Required staging acceptance

1. Run `npm ci` in a network-enabled environment.
2. Run `npm run website:install`.
3. Run all bot and website test suites until they pass.
4. Set one root `.env`; confirm `npm run integration:doctor` reports the same MongoDB host/database and media path.
5. Start bot and website; confirm `npm run smoke:deployment` returns 2/2.
6. Register a designer in WhatsApp and verify the same profile appears on the website.
7. Add a public WhatsApp contact in bot and confirm the website profile opens the same `wa.me` number.
8. Edit the contact on website and confirm `.portfolio preview` shows the same number.
9. Generate a Designer Studio notification; read it with `.portfolio notifikasi` in private WhatsApp chat.
10. Confirm `.portfolio notifikasi` is rejected in group chat and cannot access another designer's notifications.
11. Confirm `.portfolio analytics` reflects website profile/portfolio/contact activity.
12. Upload a portfolio item through website, approve it, and confirm it is visible in the public directory.
13. Verify ticket, report, moderation, portfolio and community command permissions with member, group Admin and Owner test accounts.
14. Complete the fresh-user flow: `.mulai` → choose goal/level → `.cari` → `.help` → `.support` → `.ticket`.
15. Execute a MongoDB backup and restore drill into a separate staging database; verify media backup separately.
16. Record real WhatsApp, MongoDB, restore and usability test results before production approval.

## Release decision

**Source integration, static checks, and focused tests: PASS. Production readiness: CONDITIONAL / NOT YET APPROVED.**

The release is not declared production-stable until dependency-backed suites pass, MongoDB staging verifies shared collections/indexes, a restore drill succeeds, and live WhatsApp onboarding/notification tests pass.


## Local-first setup preparation

- Corrected `.env.example` from the nonstandard `58465` port to the standard local MongoDB port `27017`.
- Set the sample website host to loopback `127.0.0.1` and local URL `http://127.0.0.1:3010`.
- Added `npm run local:start` to start bot and website together without adding a third-party process manager.
- Added a local development guide and regression tests for local configuration and launcher behavior.
- Local execution, live WhatsApp pairing, local MongoDB, and backup/restore remain unverified until run on the user's computer.
