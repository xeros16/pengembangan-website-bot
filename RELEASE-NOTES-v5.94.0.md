# PIR Visuals Bot v5.94.0 — Product Stabilization & Support System

## Summary

v5.94.0 begins the stabilization phase. It does not add another large social feature. It consolidates support, improves ticket/report workflows, tightens authorization boundaries, and exposes the live WhatsApp connection state in Owner health diagnostics.

## Implemented

- Added `.support` as a unified help center with FAQ filtering, ticket instructions, and group-report guidance.
- Added Support Center to the command registry and need-based help content.
- Updated the beginner start menu with a direct support entry and corrected the Learning Path start example.
- Tightened ticket replies: group Admins can reply only to tickets belonging to their originating group; bot Owner can reply globally.
- Tightened ticket closure: ticket owner, originating group Admin, or bot Owner only.
- Limited each account to three open tickets, ticket subjects to 180 characters, replies to 1,200 characters, and retained message history to the latest 100 entries.
- Added display-name fields for tickets/reports so normal group support output does not expose internal JIDs.
- Added group-scoped report detail and close actions, with Owner global report resolution.
- Rejected self-reports and short report reasons.
- Added additive Report/Ticket schema fields and compound indexes; no destructive migration.
- Improved `.health` to include the actual WhatsApp connection lifecycle state and combined readiness.
- Kept `/health` and `/ready` endpoints loopback-only; `/ready` remains 503 until MongoDB and WhatsApp are ready.
- Kept `.support`, `.ticket`, `.report`, and `.reports` available during maintenance mode.
- Added isolated support/ticket/report/health tests.
- Updated command catalog, user guide, README, roadmap, changelog, install guide, and operations runbook.

## Product boundaries

- Marketplace remains a designer portfolio directory with direct opt-in contact only.
- No payment, order, commission, escrow, transaction mediation, or automatic client/designer matching.
- No external support SaaS or cloud monitoring service is required.
- Health status reports process/connection state; it does not perform a live WhatsApp delivery test.
- Existing website runtime and website package version are unchanged.

## Commands

```text
.support
.support faq
.support faq tidak merespons
.support ticket
.ticket buka Bot tidak merespons setelah command
.ticket saya
.ticket list
.ticket balas <ID> <pesan>
.ticket tutup <ID>
.report @anggota | alasan laporan yang jelas
.reports
.reports detail <ID>
.reports tutup <ID> [catatan]
.health
```

## Validation

See `QA_REPORT_v5_94_0.md`. Source syntax checks passed across 229 JavaScript files; the focused regression set passed 56/56. The full bot suite reached 426/434 and website suite 372/373, with remaining load failures caused by the missing `mongoose` dependency in this execution workspace. Live WhatsApp, MongoDB staging, private message delivery, and backup/restore still require deployment-side verification.
