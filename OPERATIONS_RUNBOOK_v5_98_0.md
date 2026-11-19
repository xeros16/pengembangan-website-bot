# Operations Runbook — PIR Visuals v5.98.0

## Push notification worker

- Starts only after the Baileys connection opens; remains idle while MongoDB is disconnected.
- Processes the shared `designernotifications` outbox in bounded batches.
- Only profiles with `whatsappPushEnabled=true`, a private `whatsappPushJid`, and a valid `whatsappPushEnabledAt` can receive push.
- Notifications created before the latest opt-in are skipped.
- Default quiet hours: 22:00–08:00 Asia/Jakarta.
- Delivery states: `pending`, `processing`, `sent`, `failed`, `skipped`.
- Delivery is at-least-once: a crash after WhatsApp accepts a message but before the `sent` state is persisted can lead to a duplicate after lease recovery.
- Stale `processing` leases can be reclaimed; transient failures use bounded retry/backoff.
- Group JIDs are rejected and every send passes through `guardSocketOutbound`.
- Manual inbox remains the fallback if WhatsApp is offline or delivery fails.

Useful commands:

```text
.portfolio notifikasi
.portfolio notifikasi push status
.portfolio notifikasi push nonaktif
```

## Workspace privacy

- Client invite tokens are single-use, short-lived, and stored as hashes.
- Client sessions are project-bound, expiring, and stored as hashes.
- Designer project access is scoped by `designerId`.
- Designer may revoke every client session and invalidate outstanding invite tokens for one project.
- Project invitation and access endpoints are rate-limited.
- Project pages are no-store/no-referrer.

## Backup/restore

Stop bot and website writes, then run `npm run backup:verify` on the local host. It verifies a database restore to a unique database name and media copy hashes. Keep backup folders encrypted and access-restricted. The script excludes `.env` and WhatsApp auth/session.

## E2E

Run `npm run e2e:install` once, then `npm run test:e2e`. Browser test traces/screenshots are generated only on failure; treat them as private artifacts if local data appears in the page.

## Release gate

Do not mark Stable until all local dependencies and test suites pass, Playwright E2E passes, real WhatsApp opt-in/out and quiet-hours tests pass, workspace revocation is verified, and the MongoDB+media restore drill succeeds.
