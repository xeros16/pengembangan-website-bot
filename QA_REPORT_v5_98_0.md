# QA Report — PIR Visuals v5.98.0

## Release metadata

- Bot package: 5.98.0
- Website package: 3.45.0
- Public asset cache: `v=5980`
- Public service-worker cache: `pir-visuals-public-v41`
- Product model: hybrid — bot directory/direct contact; website optional private project workspace.

## Implemented

- Explicit WhatsApp push opt-in/out, private destination capture, and no push by default.
- Consent timestamp gate: only notifications created strictly after the latest opt-in are eligible; old unread notifications are not replayed.
- Asia/Jakarta quiet hours, default 22:00–08:00 WIB, configurable by the designer.
- Atomic outbox lease, bounded retry/backoff, opt-out queue cancellation, and private-JID/outbound-guard enforcement.
- Private linked-designer notification command access without broadening general inbound access or group permissions.
- Designer Studio push preference explanation and onboarding recommendation.
- Client project access revocation, pending invite invalidation, invite/access rate limits, and no-store/no-referrer project responses.
- Isolated database + media backup/restore verification command; no restore over the source database and no `--drop`.
- Optional Playwright desktop/mobile browser E2E harness.
- Additive profile, portfolio item, and notification outbox index setup and verification.

## Source and focused validation

- `npm run check`: PASS — 249 JavaScript files.
- `npm run website:check`: PASS.
- `npm run audit:release`: PASS.
- Focused access-control, push worker, push consent, onboarding, workspace privacy, backup/restore safety, and index tests: PASS — 62/62.
- Dedicated notification worker tests cover private JID validation, quiet hours, opt-in, opt-out/no-consent skip, pre-opt-in backlog skip, retry, and disconnected database idle behavior.

## Full suite status in this execution environment

- Website test suite: 392/393 passed. The one blocked file (`portfolio-website/tests/final-audit-v5.88.test.js`) cannot load because `mongoose` is not installed in `portfolio-website/node_modules`; no other website assertions failed.
- Root bot test suite: 479/487 passed. Eight test files/cases cannot load because `mongoose` is not installed in root `node_modules`; no other root assertions failed after release metadata alignment.
- Node.js syntax validation passes for all 249 JavaScript files.

## Not run here — requires the user's local environment

- Playwright browser E2E: `@playwright/test` and Chromium are not installed in this execution environment. Install with `npm run e2e:install`, then run `npm run test:e2e`.
- Real MongoDB backup/restore: `mongodump`, `mongorestore`, and `mongosh` are not installed here. Run `npm run backup:verify` on the local machine after installing MongoDB Database Tools.
- Live WhatsApp push: requires the user's paired test account, a linked designer profile, and explicit `.portfolio notifikasi push aktif` consent.
- Actual project access revocation: must be verified with a real test client session in the local website.

## Delivery semantics and limitations

- Push delivery is at-least-once. The atomic lease prevents concurrent workers from claiming the same notification, but a process crash after WhatsApp accepts a message and before MongoDB records `sent` can cause a duplicate when the lease is recovered.
- Inbox notifications remain available manually if WhatsApp is offline or retries are exhausted.
- Backup verification checks database collection counts and media SHA-256 after copying/restoring to isolated temporary locations. It is not a full machine disaster-recovery test.
- Browser E2E is a smoke harness; full authenticated workspace tests still require local seeded test accounts and SMTP configuration.

## Release decision

**v5.98.0 is a Development Candidate, not Stable Release.** Promote only after dependency-complete suites, Playwright, real WhatsApp opt-in/out and quiet-hours checks, workspace revocation, and MongoDB+media restore all pass locally.


## Release archive verification

- 599 source/project files are included across the two ZIP parts.
- Part 1 contains 301 source files; Part 2 contains 298 source files.
- Both ZIP CRC checks pass; no duplicate entries exist within either archive.
- Extracting both parts into one folder reconstructs every listed source file with matching SHA-256.
- `.env`, `.git`, `node_modules`, WhatsApp auth/session state, backups, portfolio uploads/media, and local runtime allowlists/settings are excluded.
