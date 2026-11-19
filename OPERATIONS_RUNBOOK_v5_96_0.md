# Operations & Recovery Runbook — PIR Visuals v5.96.0

## Services

| Service | Start command | Default health (website `.env.example` sets 3010; code fallback is 3080) |
|---|---|---|
| WhatsApp bot | `npm start` | `http://127.0.0.1:3091/ready` |
| Portfolio website | `npm run website` | `http://127.0.0.1:3080/health` |
| Shared database | MongoDB from `MONGO_URI` | Checked by `npm run verify:database` |

Keep bot and website on the same root `.env`, `MONGO_URI`, and portfolio media directory. The website process is separate from the bot process.

## Daily checks

```bash
npm run integration:doctor
npm run smoke:deployment
npm run verify:database
```

The bot `/ready` endpoint requires both WhatsApp and MongoDB to be ready. The website `/health` endpoint checks MongoDB connectivity. These checks do not replace functional WhatsApp tests.

## Website-to-bot integration

- Profiles and portfolio items share `designerprofiles` and `portfolioitems`.
- Public contact is stored as `publicWhatsApp` and mirrored to website alias `contactPhone`. The website's `/out/:designerId` route records an aggregate click and immediately redirects to the designer's WhatsApp; it does not relay messages.
- Designer Studio events create records in `designernotifications`.
- The bot reads those records only when the designer runs `.portfolio notifikasi` in private chat.
- Analytics are shared through `designeranalytics`.
- `.studio` and `.portfolio analytics` are private-chat-only and read website service, collection, testimonial, availability, lead and project-room counts only; they never list client PII or message contents.
- Notification access is scoped to the designer profile resolved from the caller's `ownerJid`.
- The bot does not relay client messages, handle orders, or process payment.

## Database backup

Run from the project root in a secure maintenance window:

```bash
mkdir -p backups
mongodump --uri="$MONGO_URI" \
  --archive="backups/pir-visuals-v5.96.0-$(date +%Y%m%d-%H%M%S).archive.gz" \
  --gzip
```

Protect the archive as sensitive production data. Back up the portfolio media directory separately because MongoDB does not contain the image bytes. Back up `.env` and WhatsApp auth state separately using encrypted storage; do not put them in public source ZIPs.

## Restore drill (staging only)

1. Create a separate empty staging database, for example `pir_visuals_restore_check`.
2. Set `MONGO_RESTORE_URI` to that staging database URI.
3. Restore the archive into the new database without dropping any production namespace:
   ```bash
   mongorestore --uri="$MONGO_RESTORE_URI" \
     --archive="backups/<backup-file>.archive.gz" \
     --gzip \
     --nsFrom="<SOURCE_DB>.*" \
     --nsTo="pir_visuals_restore_check.*"
   ```
4. Point a staging copy of the app at `MONGO_RESTORE_URI`.
5. Run:
   ```bash
   npm run integration:doctor
   npm run verify:database
   npm run smoke:deployment
   npm test
   npm run website:test
   ```
6. Verify a known designer profile, approved portfolio item, Designer Studio auth record, notification, and analytics summary. Use non-sensitive test accounts.
7. Confirm the website can load the profile/media and the bot can read the same profile and notification inbox.
8. Record the backup timestamp, restore duration, collection counts, and any missing indexes.

Do not use `--drop` or overwrite the production namespace during a restore drill.

## Production recovery

- Stop bot and website.
- Preserve logs and the current failed database snapshot.
- Restore the latest verified backup only after approving the recovery window.
- Restore media from the matching media backup.
- Re-run integration doctor, database verification, and deployment smoke tests.
- Start website and bot, then verify profile lookup, direct contact link, and notification inbox.
- Do not delete WhatsApp auth state unless a fresh device pairing is explicitly required.

## Known limitations

- Full live MongoDB restore is not performed by source-level tests.
- The `verify:database` command inspects existing collections and required indexes; it does not create or repair indexes automatically.
- Deployment smoke tests require both services to be running.
- WhatsApp QR/login, group membership metadata, and private notification delivery require a real staging account.
