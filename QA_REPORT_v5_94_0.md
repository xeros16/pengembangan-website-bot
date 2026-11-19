# QA Report — PIR Visuals Bot v5.94.0

## Release scope

This release focuses on support usability and authorization hardening. It preserves the v5.91 direct-contact-only designer directory and does not add transactions or payments. Website runtime/package versions are unchanged.

## Changes audited and implemented

- Added `.support` help center with general entry point, FAQ keyword filtering, ticket workflow, and report instructions.
- Added support to the command registry and beginner start menu.
- Restricted group Admin ticket reply/list/close actions to the ticket's originating `groupJid`.
- Allowed the bot Owner to reply to/close tickets globally; ticket owners can close their own tickets.
- Added ticket open-count limit (3 per user), input length limits, and 100-message history cap.
- Added display-name fields to ticket/report documents and removed internal JID display from group-facing ticket/report lists.
- Added group-scoped report detail/close operations and Owner global report close.
- Rejected self-report and report reasons shorter than 8 characters.
- Extended `.health` with WhatsApp connection state and combined readiness.
- Preserved loopback-only `/health` and `/ready`; support commands remain usable during maintenance mode.
- Added additive Report/Ticket schema fields and compound indexes.

## Automated checks

| Check | Result |
|---|---|
| `npm run check` | PASS — 229 JavaScript files syntax-checked |
| `npm run website:check` | PASS |
| `npm run audit:release` | PASS before packaging |
| Focused regression set (`support-center`, `design-community`, `design-learning`, `bot-health-endpoint`, `operational-stability`) | PASS — 56/56 |
| `npm test` | 426/434 passed; 8 test modules cannot load because `mongoose` is absent from this workspace |
| `npm run website:test` | 372/373 passed; the remaining `final-audit-v5.88.test.js` cannot load because `mongoose` is absent |

The `npm ci` attempt was interrupted by the execution environment's 60-second tool limit. `node_modules` is not present, so the missing dependency was not mocked or represented as a passing test. The eight blocked bot test modules are `command-catalog`, `command-routing`, `command-search`, `command-suggestions`, `designer-growth-v525`, `game-registry`, `general-help`, and one dynamic command-catalog test. The remaining website test is `final-audit-v5.88`. Syntax checks and focused tests ran directly with the Node.js runtime. `docs/commands.md` was synchronized manually because the command-doc generator imports the same dependency-backed command registry.

## Not verified here

- MongoDB staging persistence, schema index creation, and concurrent ticket/reply updates.
- Live WhatsApp message delivery to ticket owners.
- Baileys connection state across reconnect, logout, and QR pairing on the production host.
- `/health` and `/ready` behavior under the real process supervisor.
- Real user comprehension of the Support Center.
- Backup restoration on the target server.

## Required staging smoke tests

1. Run `npm ci` in a network-enabled deployment environment.
2. Run the complete bot and website test suites.
3. Create a ticket in Group A.
4. Confirm Admin A can list and reply to that ticket.
5. Confirm Admin B from Group B cannot list, reply to, or close Group A's ticket.
6. Confirm ticket owner and bot Owner can close the ticket.
7. Confirm bot Owner can reply to a ticket from a private chat.
8. Create a report in Group A and verify Group B cannot inspect or close it.
9. Verify no group-facing support output includes JIDs or phone numbers.
10. Enable maintenance mode and verify `.support` and `.ticket` still work.
11. Test `.health`, `/health`, and `/ready` while both services are connected, then during a controlled disconnect.
12. Back up and restore the database in staging.

## Release decision

**Source syntax, 54 focused regression tests, website syntax, and release audit: PASS. Full dependency-backed suite and production readiness: CONDITIONAL.**

Do not call v5.94.0 production-stable until the full suites, MongoDB staging, live WhatsApp ticket delivery, and backup/restore checks pass.
