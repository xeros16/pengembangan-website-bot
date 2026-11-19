# Backup & Restore PIR Visuals (Windows)

## What is backed up
The bot creates `backups/backup-<timestamp>/` after MongoDB connects and repeats at `BACKUP_INTERVAL_HOURS`.
Each successful backup can contain:
- `mongodb/`: `mongodump` database export
- `baileys-auth/`: WhatsApp Baileys session directory, when present
- `portfolio-media/`: portfolio upload directory when `BACKUP_INCLUDE_MEDIA=true`
- `backup-manifest.json`: timestamp, database name and included components

Default retention is 14 days. Backups contain private customer/designer data and WhatsApp credentials. Restrict Windows folder permissions and copy a second encrypted copy to another disk or secure cloud storage.

## Before production
1. Install MongoDB Database Tools and confirm `mongodump.exe` and `mongorestore.exe` are available in PATH.
2. Set `BACKUP_DIR`, `BACKUP_INTERVAL_HOURS`, `BACKUP_RETENTION_DAYS`, and `BACKUP_INCLUDE_MEDIA` in the bot `.env`.
3. Ensure the bot account can write to the backup folder.
4. Start the bot and confirm a `[BACKUP] Backup berhasil` message appears.
5. Check that the generated folder contains `mongodb` and `backup-manifest.json`.

## Manual database backup
Stop is not required for a normal `mongodump`, but for the most consistent recovery point avoid large schema migrations during the backup.

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force ".\backups\manual-$stamp" | Out-Null
mongodump --uri "$env:MONGO_URI" --out ".\backups\manual-$stamp\mongodb"
if ($LASTEXITCODE -ne 0) { throw "mongodump gagal" }
```

## Restore safely
**Do not restore over the live database first.** Test the backup into a separate database name:

```powershell
mongorestore --uri "mongodb://127.0.0.1:27017/pir_visuals_restore_test" --drop ".\backups\backup-YYYY-MM-DDTHH-mm-ss-sssZ\mongodb"
```

Check the collections and document counts in the test database. To restore production:
1. Stop the WhatsApp bot and portfolio website.
2. Take one more backup of the current database.
3. Restore the intended dump using the correct production `MONGO_URI` and `--drop`.
4. Restore `baileys-auth` to the configured `AUTH_DIR` only while the bot is stopped.
5. Restore `portfolio-media` into the exact physical folder configured by `PORTFOLIO_UPLOAD_DIR`.
6. Start MongoDB, website, then bot; verify `/health`, WhatsApp connection, portfolio images and Designer Studio login.

Example production restore (verify the target URI carefully):

```powershell
mongorestore --uri "$env:MONGO_URI" --drop ".\backups\backup-YYYY-MM-DDTHH-mm-ss-sssZ\mongodb"
```

## Important limitations
- MongoDB backup does not include `.env`, source code, Node.js dependencies, or files outside the Baileys auth and portfolio media folders.
- Keep a separate secure copy of `.env` and the exact release ZIP.
- Do not upload backup folders, `.env`, or `baileys-auth` to public repositories or share them in chat.
- `mongodump` must be installed separately; the bot reports a backup error if MongoDB Database Tools are unavailable.
