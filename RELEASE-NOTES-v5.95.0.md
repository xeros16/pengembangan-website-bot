# PIR Visuals Bot v5.95.0 — Production Readiness & Support Hardening

## Summary

v5.95.0 continues the production-readiness phase without introducing another large feature family. It closes a usability gap in the ticket workflow, protects support conversation privacy, and adds best-effort abuse throttling to tickets and group reports.

## Implemented

- Added `.ticket detail <ID>` for the ticket owner, the Admin of the originating group, and the bot Owner.
- Detail output shows at most the latest 15 messages, labels speakers as `Kamu`, `Pengguna`, or `Tim bantuan`, and never prints sender JIDs.
- Ticket owners can read their own tickets from any chat. Admin access remains restricted to the ticket's originating `groupJid`.
- Kept the existing limit of three open tickets per account and added a limit of five newly created tickets per account in a rolling 24-hour window.
- Added a best-effort limit of three reports per member per group in a rolling 10-minute window.
- Added MongoDB indexes supporting report throttling by group/reporter/time and ticket creation history by user/time.
- Updated Support Center, command catalogue examples/permissions, command docs, README, changelog, and roadmap.
- Synchronized root `package.json`, `package-lock.json`, and website regression fixtures to bot version 5.95.0. Website runtime/package/cache version remains unchanged.
- Added regression tests for ticket detail privacy, requester access, cross-group Admin isolation, ticket throttling, report throttling, and user-facing help discovery.

## Commands

```text
.support
.support faq
.support ticket
.ticket buka Bot tidak merespons setelah command
.ticket saya
.ticket detail <ID>
.ticket list
.ticket balas <ID> <pesan>
.ticket tutup <ID>
.report @anggota | alasan laporan yang jelas
.reports
.reports detail <ID>
.reports tutup <ID> [catatan]
.health
```

## Limits and authorization

- Maximum three open tickets per account.
- Maximum five new tickets per account per rolling 24 hours.
- Maximum three reports per member per group per rolling 10 minutes.
- Ticket detail: owner, originating group Admin, or bot Owner.
- Ticket reply: originating group Admin or bot Owner.
- Ticket close: ticket owner, originating group Admin, or bot Owner.
- Report list/detail/close: originating group Admin; bot Owner has global report controls.

The count-based throttles are best-effort. Simultaneous requests can race between `countDocuments` and document creation; verify behavior under expected production concurrency. This release does not claim distributed atomic rate limiting.

## Product boundaries

- Designer directory remains portfolio discovery with direct opt-in contact only.
- No payments, orders, commissions, escrow, transaction mediation, or public client/designer matching.
- No external ticketing provider or monitoring SaaS is required.
- Website runtime and UI are unchanged in this release.

## Validation

See `QA_REPORT_v5_95_0.md`. Source syntax, website syntax, release audit, and focused tests passed. Full dependency-backed tests and live staging remain conditional because `mongoose` and other runtime dependencies are not installed in this execution workspace.
