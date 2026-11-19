# PIR Visuals v5.32.0 — Reliability, MongoDB & Production Hardening

## Bot / backup system
- Automatic database backup starts after MongoDB is ready, then repeats every `BACKUP_INTERVAL_HOURS`.
- Backup validates that `mongodump` produced a non-empty database directory.
- Backup includes a manifest with timestamp, database name, included components and restore hint.
- Copies Baileys auth directory to each backup when it exists.
- Copies portfolio media to each backup when `BACKUP_INCLUDE_MEDIA=true` and the configured folder exists.
- Old backup folders named `backup-YYYY-...` are pruned after `BACKUP_RETENTION_DAYS` (default 14; configurable 1–365).
- Prevents overlapping backup jobs; failed partial backup folders are removed.
- New `.env.example` settings: `BACKUP_DIR`, `BACKUP_RETENTION_DAYS`, `BACKUP_INCLUDE_MEDIA`.

## Website / database
- Added compound indexes for public directory sorting, portfolio listing, active service pricing, public collections and testimonials.
- Directory cards now fetch only fields they display.
- Daily analytics now track profile views, portfolio views and contact clicks, with a rolling 90-day cap.
- Upload parser enforces maximum 8 MB per image and rejects empty image parts.
- Standard security headers are applied to all responses; HSTS is enabled when `NODE_ENV=production` and public base URL uses HTTPS.
- HTTP request/header timeouts and max header count are configured.
- `/health` reports MongoDB readiness and v5.32.0.
- Login-attempt tracking prunes expired entries when its map grows.

## Deployment guidance
- Use Node.js 20 LTS or newer.
- Keep the Node website listener bound to `127.0.0.1` when using a reverse proxy; terminate TLS at Nginx/Caddy/IIS ARR.
- Set `PORTFOLIO_PUBLIC_BASE_URL` to the canonical HTTPS domain in production.
- Bot and website must share the same `MONGO_URI` database and the same `BOT_DATA_ROOT` / `PORTFOLIO_UPLOAD_DIR` physical folder.
- Backups contain sensitive database data and Baileys credentials. Restrict access to the backup folder and copy backups to an encrypted off-device location.
- A mongodump backup does not replace an independent backup of `.env`, bot source, and other local configuration files.
- Restore database with `mongorestore --uri "<MONGO_URI>" --drop "<backup-folder>\mongodb"`. Restore Baileys session from `baileys-auth` only when the bot is stopped. Restore portfolio media into the configured upload directory.
- Test restores in a separate database before using them for production recovery.

## Validation
- `node scripts/check-js.js`: 171 JavaScript files lulus.
- Website automated tests: 26/26 lulus.
- Backup hardening tests: 2/2 lulus.
- Existing Designer Studio regression tests: 4/4 lulus.
- Live MongoDB, Baileys, SMTP and `mongodump` integration were not exercised in this isolated build environment; full root integration suite still requires `npm ci` on the target Windows machine.

## Windows operations guide
- Added `docs/BACKUP-RESTORE-WINDOWS.md` with manual backup, isolated test restore, and production recovery steps.
