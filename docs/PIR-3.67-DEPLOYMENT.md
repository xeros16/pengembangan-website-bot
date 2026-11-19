# Install and deploy PIR Visuals 3.67

The website update applies to the supplied website 3.66.0 and bot 6.7.13 project. Use Node.js 22 or newer, npm, MongoDB and a durable writable media directory. Use the same MongoDB database and absolute media path for the bot and website.

## Install the update

1. Record the active release directory, service definitions and image tag. Create and verify a database backup and a copy or snapshot of the shared upload volume. Store backups, environment configuration and WhatsApp session files in a private location.
2. Use a fresh release directory with the current source as its base. If the source is still inside the supplied ZIP, extract that ZIP in the release directory first. Unzip the incremental 3.67 update into a second staging directory and copy its listed files over the release source.

   ```bash
   pir_update_stage=$(mktemp -d)
   unzip /path/to/pir-visuals-3.67.0-update.zip -d "$pir_update_stage"
   cd /path/to/pir-visuals-release
   cp -a "$pir_update_stage"/. ./
   npm ci --no-audit --no-fund
   npm run website:install
   npm run check
   npm run website:check
   ```

3. Mount existing runtime configuration and upload storage into the staged deployment. Keep the original database name, live records and WhatsApp session location. Inspect file ownership so the website and bot can read existing images and write new ones.
4. Read the QA report, run the smoke checks against a disposable or restored staging database and verify the staging journeys. Review browser behavior, dependency alerts and database index status before switching traffic.

## Production settings

| Setting | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORTFOLIO_PUBLIC_BASE_URL` and `SITE_URL` | Same canonical HTTPS origin. Configure TLS termination before directing traffic to the website. |
| `PORTFOLIO_WEB_HOST`, `PORTFOLIO_WEB_PORT` | Website bind address and internal port. Use a private network or loopback behind the TLS proxy. The existing Compose service uses port 3080. |
| `MONGO_URI` | Existing shared database URI with the application database selected. Inject credentials using the service's secret mechanism. |
| `BOT_DATA_ROOT`, `PORTFOLIO_UPLOAD_DIR` | Use a shared volume. Set `PORTFOLIO_UPLOAD_DIR` to an absolute path if the services have separate working directories. |
| `DASHBOARD_USER`, `DASHBOARD_PASSWORD` | Owner credentials in a secret store. Use a strong unique password of at least 12 characters. Restrict dashboard access to authorized operators. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Provider configuration for verification, reset, reviews and project invitations. Validate TLS and bounce policies in staging. |
| `ANALYTICS_SALT` | Stable high-entropy secret. |
| `TRUST_CLOUDFLARE_IP_HEADER` | Enable only behind a trusted proxy path that removes spoofed headers and prevents direct access to Node. |
| `AUTH_DIR`, `OWNER_JIDS` | Existing bot-only settings. Protect linked-device credentials and restrict the bot's owner configuration. |

## Start, monitor and roll back

- Native deployment uses `npm run website` from the repository root, with environment settings injected by the supervisor. Run the bot separately with `npm start` only where WhatsApp is deliberately configured. Stop the website with SIGTERM and allow 30 seconds for shutdown.
- The root Dockerfile builds the website. The supplied proxy and service definitions can be launched from the repository root with `docker compose -f deploy/compose.yaml --env-file deploy/production.env up -d --build`. Configure `deploy/production.env` securely using the example as a reference and set `COMPANY_DOMAIN`. Map the existing upload volume into both services before deploying. A newly created empty volume will not display prior uploads.
- Probe `/health` from the internal network. A healthy response requires a working MongoDB ping. Monitor HTTP error rates, MongoDB connection and query latency, disk capacity, and failures in SMTP or WhatsApp queues. Use the repository smoke command with `PORTFOLIO_SMOKE_BASE_URL` configured in the test shell. Avoid logging query strings on invite, verification and password-reset URLs.
- Run `npm run verify:database` using the correct database configuration for production index checks. Review proposed indexes before using `npm run db:ensure-shared-indexes`. Keep an approved change window for any index operation.
- Pair scheduled database backups with upload-volume snapshots. Restore into a different database and media directory, compare counts and file checksums and smoke-test the restored deployment. The repository's `npm run backup:verify` requires MongoDB Database Tools and a dedicated backup/restore environment. See `docs/BACKUP-RESTORE-VERIFICATION-v5.98.0.md`.
- To roll back, redirect traffic to the previous verified code or image and restart the services with their existing configuration and storage. This release has no schema migration. Preserve new records and uploads. Restore from backup only if data recovery is authorized and necessary. If reverting to earlier code, keep the media visibility fix in place or block public media temporarily pending verification.
