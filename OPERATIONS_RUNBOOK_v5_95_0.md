# Operations Runbook — PIR Visuals Bot v5.95.0

## Service boundaries

- The designer directory remains a portfolio showcase with opt-in direct contact only.
- The bot does not process payments, orders, commissions, escrow, or client/designer disputes.
- Support tickets and group reports are operational support records, not a commercial transaction system.

## Ticket operation

- `.ticket buka <summary>` creates a ticket.
- `.ticket saya` lists the caller's tickets.
- `.ticket detail <ID>` shows the latest 15 messages to the ticket owner, originating group Admin, or bot Owner.
- `.ticket list` is restricted to the current group's Admin.
- `.ticket balas <ID> <message>` is restricted to the originating group Admin or Owner.
- `.ticket tutup <ID>` is available to the ticket owner, originating group Admin, or Owner.

Limits:
- Three open tickets per account.
- Five newly created tickets per account per rolling 24 hours.
- Three reports per member/group per rolling 10 minutes.
- Ticket subject maximum 180 characters, reply maximum 1,200 characters, and latest 100 messages retained.

The count-based throttles use database counts followed by document creation. They are best-effort and can race under simultaneous requests. Monitor abuse patterns and consider a dedicated atomic rate-limit store if traffic warrants it.

## Report operation

- Members submit a report in a group with a reason of at least eight characters.
- Self-reporting is rejected.
- Group Admins can list, inspect, and close reports only for the current group.
- Owner can use the global report controls.
- Group-facing output does not reveal reporter or target JIDs.

## Privacy and access

- Conversation output uses role labels (`Kamu`, `Pengguna`, `Tim bantuan`) rather than sender JIDs.
- A ticket owner can read their own ticket from any chat.
- Admin access always includes the originating `groupJid` in its query filter.
- Owner access is global and depends on the configured `OWNER_JIDS` identity checks.
- Never paste OTP, passwords, tokens, or payment credentials into tickets.

## Monitoring

- `.health` is Owner-only and reports WhatsApp lifecycle state, MongoDB readiness, uptime, memory, and active sender queue count.
- `GET /health` is a local liveness/status endpoint.
- `GET /ready` returns 503 until MongoDB and WhatsApp are both ready.
- Health endpoints must remain bound to loopback and must not be exposed publicly.
- A healthy connection state does not guarantee successful delivery to every recipient.

## Incident response

- Cross-group ticket access: stop support operations, inspect query filters for `groupJid`, preserve logs, and run the cross-group regression tests.
- Excessive ticket/report creation: review rolling-window counts and group context; do not delete reports solely to reset a throttle.
- Ticket DM delivery failure: preserve the ticket record, notify the Owner, and use `.ticket detail` for authorized follow-up.
- Database unavailable: do not claim tickets/reports were saved; restore connectivity and verify persistence before retry.
- Suspected data exposure: restrict access, preserve audit context, inspect output formatters, and avoid reposting JIDs or personal contact data.

## Backup and release

- Include Report and Ticket collections and their indexes in MongoDB backup/restore checks.
- Verify backup integrity and restore in staging before production rollout.
- Preserve `.env`, WhatsApp auth/session state, allowlists, aliases, bot settings, and runtime files during source updates.
- Complete the staging checklist in `QA_REPORT_v5_95_0.md` before declaring stable.
