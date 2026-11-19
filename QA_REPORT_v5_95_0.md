# QA Report — PIR Visuals Bot v5.95.0

## Scope

Production-readiness hardening for the Support Center and ticket/report workflows. No new transaction, payment, order, or marketplace mediation behavior is introduced. Website runtime/package/cache version remains unchanged.

## Implemented and reviewed

- `.ticket detail <ID>` exposes only the latest 15 messages to the ticket owner, originating group Admin, or bot Owner.
- Requester-first ticket lookup allows the ticket owner to read their own ticket from any chat. Admin lookup always includes the current `groupJid`.
- Conversation output uses role labels and does not expose sender JIDs.
- Ticket limits: three open tickets per account and five new tickets per account per rolling 24 hours.
- Report throttle: three reports per member/group per rolling 10 minutes.
- Added report and ticket query indexes for the new time-window counts.
- Updated user-facing help, command examples, permissions, and release docs.
- Updated root package version and lockfile version to 5.95.0 and synchronized website regression fixtures that assert the root package version.

## Automated checks

| Check | Result |
|---|---|
| `npm run check` | PASS — 229 JavaScript files syntax-checked |
| `npm run website:check` | PASS |
| `npm run audit:release` | PASS |
| Focused tests (`support-center`, `design-learning`, `operational-stability`, `bot-health-endpoint`) | PASS — 51/51 |
| `npm test` | 432/440 passed; 8 tests/modules cannot load because `mongoose` is missing from this workspace |
| `npm run website:test` | 372/373 passed; the remaining test module cannot load because `mongoose` is missing |
| `npm run docs:commands` | BLOCKED — imports the command registry, which transitively requires missing `mongoose`; `docs/commands.md` was updated manually |
| `npm ci --ignore-scripts --no-audit --no-fund` | TIMEOUT after 180 seconds; no `node_modules` directory was created |
| Split ZIP package | PASS — 556 source files across two archives; CRC and combined SHA-256 reconstruction verified; runtime/secrets excluded |

The eight bot-suite load failures are:
- `tests/command-catalog.test.js`
- `tests/command-routing.test.js`
- `tests/command-search.test.js`
- `tests/command-suggestions.test.js`
- `tests/designer-growth-v525.test.js`
- `tests/game-registry.test.js`
- `tests/general-help.test.js`
- One dynamic command-catalog test in `tests/menu-designer.test.js`

They fail with `ERR_MODULE_NOT_FOUND` for `mongoose` (and one optional media path also reports missing `sharp`). The remaining website module is `portfolio-website/tests/final-audit-v5.88.test.js`, which fails to load `portfolio-website/models.js` for the same missing `mongoose` dependency. These are dependency-load failures, not assertion failures in the tests that executed.

## Not verified in this workspace

- MongoDB query/index creation and persisted ticket/report throttling.
- Concurrency behavior of count-then-create throttles; they are best-effort, not atomic distributed rate limits.
- Live WhatsApp private delivery for ticket replies.
- Real Admin metadata and LID/phone JID normalization across WhatsApp clients.
- Full website integration tests requiring Mongoose.
- Production backup/restore and rollback on the target host.

## Required staging smoke tests

1. Run `npm ci` on a network-enabled staging host.
2. Run `npm test`, `npm run website:test`, `npm run check`, `npm run website:check`, `npm run docs:commands`, and `npm run audit:release`.
3. Create a ticket, then read its latest conversation with `.ticket detail <ID>` as the owner.
4. Verify ticket detail never shows sender JIDs or phone identifiers.
5. Verify the originating group Admin can read/reply, while an Admin from another group cannot read/reply/close.
6. Verify the bot Owner can inspect and reply to tickets globally.
7. Verify three-open-ticket and five-new-tickets-per-24-hours limits.
8. Verify the report throttle of three per member/group per 10 minutes.
9. Test concurrent requests and record the observed count-based throttle behavior.
10. Verify support commands remain available in maintenance mode.
11. Test `/health` and `/ready` during normal operation and controlled WhatsApp/MongoDB disconnection.
12. Back up and restore MongoDB in staging; confirm Report/Ticket indexes after restore.

## Release decision

**Syntax, focused regression tests, website syntax, and source release audit: PASS. Full dependency-backed suite and production readiness: CONDITIONAL.**

Do not call v5.95.0 production-stable until dependencies install, all tests pass, MongoDB/WhatsApp staging succeeds, and backup/restore is verified.
