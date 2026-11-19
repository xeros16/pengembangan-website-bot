# Operations Runbook — PIR Visuals v5.87.0

## 1. Local health monitoring

The bot exposes a small HTTP server bound only to loopback:
- `GET http://127.0.0.1:3091/health` — liveness; HTTP 200 when the process responds.
- `GET http://127.0.0.1:3091/ready` — readiness; HTTP 200 only when MongoDB is connected and the WhatsApp connection state is `open`, otherwise HTTP 503.

The endpoint does not expose credentials, database URI, JIDs or user data. Do not change `BOT_HEALTH_HOST` to a public interface. A process monitor running on the same machine can poll `/ready`.

## 2. Backup settings

Recommended baseline:
```dotenv
BACKUP_DIR=backups
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_DAYS=14
BACKUP_INCLUDE_LOCAL_STATE=false
```

A successful backup directory contains:
- MongoDB dump directory with BSON files.
- `backup-manifest.json` listing the dump inventory and optional local-state inventory.

The bot rejects an empty dump or a dump without BSON files. It will skip a scheduled backup if a previous backup is still running. Retention deletes only generated `backup-YYYY-MM-DDT...` directories directly under `BACKUP_DIR` and older than the configured retention period.

### Optional local state

`BACKUP_INCLUDE_LOCAL_STATE=true` also copies:
- `baileys-auth` — WhatsApp authentication credentials.
- `portfolio-media` — local designer portfolio uploads.

This setting is disabled by default. WhatsApp credentials can grant account access. Enable it only when the backup destination is access-controlled, encrypted at rest and covered by an appropriate retention policy. Never send these backups through public links or include them in update ZIPs.

## 3. Restore drill

1. Stop bot and website processes.
2. Copy the chosen backup directory to a protected staging location.
3. Inspect `backup-manifest.json` and confirm the BSON inventory exists.
4. Restore the dump to a disposable MongoDB database using `mongorestore --uri <staging-uri> <backup-directory>`.
5. Verify expected collections and sample documents.
6. Restore `portfolio-media` only if needed and preserve file permissions.
7. Restore `baileys-auth` only when intentionally restoring the same bot identity; do not run two bot instances with the same WhatsApp session.
8. Keep the production database untouched during the drill.

## 4. Designer Studio activation

- A designer requests activation in a private chat: `.portfolio dashboard setup`.
- The bot verifies that the requester owns the designer profile.
- The token is shown only in the private chat, stored as a hash and expires after 20 minutes.
- Complete the form at `/studio/setup` with designer ID, email, token and a password of at least 12 characters.
- Verify the email through the link sent by SMTP.
- Request login OTP in private chat: `.portfolio dashboard otp`.
- OTP is cryptographically generated, stored as a hash and expires after five minutes.

Never ask a designer to send the activation token or OTP in a group.

## 5. Profile controls

Designer commands:
- `.portfolio website`
- `.portfolio qr`
- `.portfolio analytics`
- `.portfolio bahasa id` or `.portfolio bahasa en`
- `.portfolio watermark on` or `.portfolio watermark off`

Owner-only curation:
- `.portfolio verified DSN-ID on|off`
- `.portfolio popular DSN-ID on|off`

The watermark is a subtle designer-name mark applied to public portfolio media while enabled. Verify the output with real uploaded image formats in staging.

## 6. Release checklist

- Run `npm run check`.
- Run `npm test`.
- Run `npm run website:check`.
- Run `npm run website:test`.
- Validate `/health` and `/ready` locally.
- Complete a real backup and restore drill.
- Validate WhatsApp setup and OTP on a test designer account.
- Verify SMTP and HTTPS behavior behind the production proxy.
