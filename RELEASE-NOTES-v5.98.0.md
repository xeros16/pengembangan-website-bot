# PIR Visuals v5.98.0 — Automation, Privacy & End-to-End Experience

## Product direction

- WhatsApp bot remains a portfolio directory and direct-contact channel.
- Website retains the optional client/designer project workspace.
- PIR Visuals does not process payment, checkout, commission, escrow, or mediate transactions.

## WhatsApp push notifications

- Designer explicitly opts in from the linked private WhatsApp chat with `.portfolio notifikasi push aktif`.
- Opt-out is immediate through `.portfolio notifikasi push nonaktif`.
- Only notifications created after the latest opt-in timestamp are eligible; old inbox items are not replayed.
- Default quiet hours are 22:00–08:00 WIB; designers can set another range or disable quiet hours.
- Delivery uses an atomic lease, bounded retry/backoff (1/5/15/60 minutes, five total attempts), private-JID validation, and the existing outbound allowlist guard. Delivery is at-least-once if the process crashes after WhatsApp accepts a message but before MongoDB persists the sent state.
- Group delivery is rejected. The manual `.portfolio notifikasi` inbox remains available as fallback.
- Push preferences and outbox state are shared through the existing `designerprofiles` and `designernotifications` collections.

## Hybrid workspace privacy

- Designer can revoke all active client workspace sessions and invalidate any unused invitation token from the project room.
- Client invitation access is rate-limited by IP; repeated designer invitations are rate-limited per designer.
- Sensitive client/designer project pages use `Cache-Control: no-store` and `Referrer-Policy: no-referrer`.
- Existing single-use, 30-minute invitation tokens and project-bound, expiring client sessions are retained.

## Backup, restore, and browser E2E

- `npm run backup:verify` dumps the configured database, copies portfolio media, restores into a unique `pir_restore_check_*` database, and compares collection document counts plus media SHA-256.
- The restore check never uses `--drop` and never restores over the source database.
- Optional Playwright tests cover homepage, directory search surface, unauthenticated workspace protection, designer workspace login redirect, and mobile horizontal overflow.
- Playwright is a development-only optional tool installed with `npm run e2e:install`; it is not a production runtime dependency.

## Compatibility

- All new profile preference fields default to push disabled.
- New notification documents enter the outbox as pending; worker skips them unless the profile explicitly opted in after the notification was created.
- Historical notifications without the new delivery fields remain readable through the manual inbox and are not auto-pushed.
- Project session revocation fields are additive. Existing project data and client sessions remain unchanged until a designer explicitly revokes access.
- New index creation is additive and does not drop existing indexes.

## Validation

See `QA_REPORT_v5_98_0.md`. Live WhatsApp delivery, browser E2E, and actual MongoDB backup/restore must be completed on the local computer before Stable Release.
