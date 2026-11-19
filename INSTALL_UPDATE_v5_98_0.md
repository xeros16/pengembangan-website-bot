# Install & Update Guide — PIR Visuals v5.98.0

## Before updating

1. Stop bot and website processes.
2. Keep `.env`, WhatsApp auth/session, `config/allowed-chats.json`, local settings, MongoDB database, and portfolio media.
3. Take a pre-update database + media backup. Do not extract release ZIPs over runtime folders.
4. Extract both source ZIP parts into the same project directory; neither part is standalone.

## Dependencies

From the project root:

```bash
npm ci
npm run website:install
```

Bot package: `5.98.0`; website package: `3.45.0`.

## Additive indexes

Run after MongoDB is online:

```bash
npm run db:ensure-shared-indexes
npm run verify:database
```

The index command adds directory sort and notification outbox indexes. It does not drop collections or remove existing indexes.

## Push notification setup

1. Ensure the designer's WhatsApp account is linked to their PIR Visuals profile.
2. Open the private chat with the bot and send `.portfolio notifikasi push aktif`.
3. Check `.portfolio notifikasi push status`.
4. Default quiet hours are 22:00–08:00 WIB. Change them with `.portfolio notifikasi push jam 21:00-07:00`.
5. Disable at any time with `.portfolio notifikasi push nonaktif`.

Only notifications created after the latest explicit opt-in are sent. Existing inbox items are not replayed. The manual inbox remains `.portfolio notifikasi`.

## Run automated checks

```bash
npm run check
npm run website:check
npm run audit:release
npm test
npm run website:test
```

## Optional browser E2E

Playwright is not a production dependency. Install once on a network-enabled local machine:

```bash
npm run e2e:install
npm run test:e2e
```

For a seeded designer profile, set `E2E_DESIGNER_PATH=/designer/DSN-XXXX` (or the actual public profile path) before running to include the direct WhatsApp CTA test.

## Backup and restore drill

Install MongoDB Database Tools (`mongodump`, `mongorestore`) and run:

```bash
npm run backup:verify
```

The script creates a private backup folder, restores to a unique temporary database, verifies collection counts and media hashes, then removes only that temporary database. Use `npm run backup:verify -- --keep-restore-db` to retain the isolated restore database for inspection. Never share backup files; they contain private client/designer data.

## Local functional acceptance

1. Start bot and website with `npm run local:start`.
2. Verify the bot `.portfolio notifikasi push status` works in a linked private chat.
3. Opt in, trigger a website event (for example a new project message), and confirm one private WhatsApp push arrives outside quiet hours.
4. Test quiet hours and verify delivery is delayed until the configured end.
5. Opt out and verify no subsequent push is sent; the manual inbox still works.
6. Try the same notification command in a group; it must be rejected.
7. In a project room, revoke client access and confirm the previous client session is rejected; re-invite only if intended.
8. Run Playwright E2E and the backup/restore drill.

## Rollback

Stop both services and restore the pre-update source, MongoDB backup, and portfolio media together. New profile fields and notification delivery fields are additive; older releases may ignore them. Do not restore the database over a live application process.
