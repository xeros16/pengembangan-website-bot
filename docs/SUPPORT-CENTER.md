# PIR Visuals v5.94.0 — Support Center & Operations

## Support Center

The `.support` command is the single entry point for common help journeys.

| Command | Purpose |
|---|---|
| `.support` | Open the help center |
| `.support faq` | Browse common questions |
| `.support faq <keyword>` | Filter FAQ entries by keyword |
| `.support ticket` | Read the ticket workflow |
| `.support laporan` | Read group-report instructions |
| `.help <command>` | Read a command-specific guide |
| `.cari <need>` | Find a feature using natural language |
| `.mulai` | Start interactive onboarding |

## Ticket workflow

| Command | Access |
|---|---|
| `.ticket buka <summary>` | Any user; maximum 3 open tickets per account |
| `.ticket saya` | Ticket owner |
| `.ticket list` | Admin of the ticket's originating group |
| `.ticket balas <ID> <message>` | Admin of the originating group or bot Owner |
| `.ticket tutup <ID>` | Ticket owner, Admin of the originating group, or bot Owner |

Ticket summaries are limited to 180 characters and replies to 1,200 characters. The last 100 messages are retained per ticket. User-facing output uses the WhatsApp display name when available instead of exposing the internal JID.

Group Admin actions are strictly scoped to the ticket's `groupJid`. An Admin from another group cannot list, reply to, or close that ticket. The bot Owner can reply to and close tickets globally. A ticket owner can close their own ticket.

A private ticket is stored with its private chat JID as `groupJid`; it is therefore available to the ticket owner and bot Owner, not to unrelated group admins.

Do not submit passwords, OTP codes, access tokens, payment credentials, or other secrets in tickets.

## Group reports

| Command | Access |
|---|---|
| `.report @member \| <reason>` | Any member, group only |
| `.reports` | Admin of the current group |
| `.reports detail <ID>` | Admin of the report's originating group |
| `.reports tutup <ID> [resolution]` | Admin of the report's originating group |
| `.reports [limit]` | Bot Owner, global list |
| `.reports tutup <ID> [resolution]` | Bot Owner, global resolution |

Reports require a meaningful reason (at least 8 characters). Self-reporting is rejected. Group Admin report actions include `groupJid` in every database filter. User-facing report lists do not reveal reporter/target JIDs.

## Monitoring

The Owner command `.health` now reports:

- Process uptime and memory.
- MongoDB connection state and readiness.
- Current WhatsApp connection lifecycle state (`open`, `close`, `connecting`, `closing`).
- Reconnect state and active sender queue count.
- Node.js runtime version.

The HTTP health endpoints remain loopback-only:

- `GET /health` returns current process/connection status.
- `GET /ready` returns HTTP 503 unless both MongoDB and WhatsApp are ready.

The health check does not send a test WhatsApp message and does not guarantee delivery to every recipient. The `/ready` endpoint is suitable for local process supervision or a reverse proxy that can reach loopback; it must not be exposed publicly.

## Maintenance mode

The following support and discovery commands remain available during maintenance mode:

- `.help`, `.menu`, `.mulai`, `.cari`
- `.support`, `.ticket`, `.report`, `.reports`

This lets users find help and submit support tickets while other bot features are paused.

## Database changes

v5.94.0 adds optional display, resolution, and timestamp fields to the existing Report and Ticket schemas, plus compound query indexes. These are additive schema changes. Existing documents remain readable; no collection drop or destructive migration is required.

## Staging checklist

1. Open `.support` and browse `.support faq`.
2. Create a ticket and confirm it appears in `.ticket saya`.
3. Confirm a group Admin can list/reply only to tickets from their own group.
4. Confirm an Admin from another group cannot reply to or close the ticket.
5. Confirm the ticket owner can close their own ticket.
6. Confirm the bot Owner can reply to a ticket from a private chat.
7. Create a report, inspect it as the originating group Admin, and close it.
8. Confirm another group's Admin cannot inspect or close the report.
9. Confirm report and ticket outputs do not expose internal JIDs.
10. Enter maintenance mode and verify support commands remain available.
11. Check `.health`, `/health`, and `/ready` while WhatsApp and MongoDB are connected and disconnected.
