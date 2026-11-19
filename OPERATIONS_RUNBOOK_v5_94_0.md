# Operations Runbook — PIR Visuals Bot v5.94.0

## First-line support

- `.support` — support entry point.
- `.support faq` — common troubleshooting.
- `.ticket buka <summary>` — open a support ticket.
- `.ticket saya` — inspect personal tickets.
- `.report @member | reason` — report group conduct.

Never ask users to send passwords, OTP codes, access tokens, or payment credentials.

## Ticket permissions

- Ticket owner: open/list own tickets and close own ticket.
- Admin: list/reply/close tickets only when `ticket.groupJid` matches the current group.
- Bot Owner: global ticket list via `.tickets`, global reply/close via `.ticket`.
- Each account may have at most three open tickets.
- Ticket message history retains the most recent 100 messages.

If a group Admin cannot access a ticket, confirm that the ticket was created in the same group. Do not bypass the `groupJid` filter.

## Report handling

- Group Admin: `.reports`, `.reports detail <ID>`, `.reports tutup <ID> [resolution]` within the current group.
- Bot Owner: `.reports` global list and `.reports tutup <ID> [resolution]`.
- Reports require a reason of at least eight characters.
- Public group output must not expose reporter/target JIDs.

## Health monitoring

- `.health` is Owner-only and shows WhatsApp lifecycle state, MongoDB readiness, reconnect status, uptime, memory, sender queue count, and Node.js version.
- `GET /health` is local process health.
- `GET /ready` is readiness and returns 503 unless MongoDB and WhatsApp are ready.
- The health server must bind only to loopback. Never proxy it publicly without an authenticated private monitoring layer.
- A healthy socket does not guarantee successful message delivery to every recipient.

## Maintenance mode

Keep support commands available during maintenance. If maintenance mode blocks `.support`, `.ticket`, `.report`, or `.reports`, check the `maintenanceAllowed` set in `features/command-handler.js`.

## Incident response

- Cross-group ticket access attempt: preserve logs, verify all Admin queries include `groupJid`, and do not share ticket contents across groups.
- Unwanted report exposure: remove internal JID fields from output and review group scoping.
- Ticket reply DM failure: the reply remains recorded; ask the user to check `.ticket saya` or contact an Admin.
- MongoDB unavailable: ticket/report writes must not claim success. Restore database connectivity before resuming.
- WhatsApp disconnected: check `.health`, process logs, pairing state, and `/ready`; do not delete authentication state unless a deliberate re-pair is approved.

## Production gate

Do not label the release stable until the full bot/website suites pass with dependencies installed, group-isolation smoke tests pass, WhatsApp ticket delivery is verified, and database backup/restore succeeds.
