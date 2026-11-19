# Install & Update Guide — PIR Visuals v5.96.0

## Before deployment

A GitHub Actions workflow is included at `.github/workflows/ci.yml`. After pushing the source to a connected repository, it installs the root and website dependencies from their lockfiles and runs both full test suites on a network-enabled runner. It does not deploy or access staging secrets.

- Node.js 20 LTS or newer.
- MongoDB connection available to both processes.
- `mongodump` and `mongorestore` installed for backup/restore drills.
- DNS/HTTPS and SMTP configured for the public website and Designer Studio email verification.
- Back up `.env`, WhatsApp auth state, uploaded portfolio media, and MongoDB separately.

## Install/update

1. Stop the existing bot and website processes.
2. Take a database backup and copy the media directory to a secure backup location.
3. Extract both source ZIP parts into the same release directory.
4. Copy the existing `.env` and `auth_info_baileys`/configured `AUTH_DIR` from the previous installation. Do not overwrite local secrets with `.env.example`.
5. Confirm root `.env` contains one shared `MONGO_URI`, `PORTFOLIO_UPLOAD_DIR`, `PORTFOLIO_PUBLIC_BASE_URL`, `DESIGN_COMMUNITY_GROUPS`, and required SMTP settings.
6. Install root dependencies:
   ```bash
   npm ci
   ```
7. Install website-specific dependencies:
   ```bash
   npm run website:install
   ```
8. Run local diagnostics and static checks:
   ```bash
   npm run doctor
   npm run integration:doctor
   npm run check
   npm run website:check
   npm run audit:release
   ```
9. Run complete test suites:
   ```bash
   npm test
   npm run website:test
   npm run docs:commands
   ```
10. Start the bot and website as separate processes using the same root `.env` and MongoDB database. Website default port in code is 3080; the provided `.env.example` sets `PORTFOLIO_WEB_PORT=3010`.
11. Run the deployment smoke test:
   ```bash
   npm run smoke:deployment
   ```
12. Verify database collections/indexes:
   ```bash
   npm run verify:database
   ```
13. Complete the staging acceptance checklist before switching production traffic.

## Process separation

- Bot: `npm start`.
- Website: `npm run website`.
- Both use the same `MONGO_URI`.
- Website loads the project-root `.env` first. Keep shared settings in the root `.env`; do not maintain conflicting copies in `portfolio-website/.env`.
- Both processes must resolve the same `PORTFOLIO_UPLOAD_DIR`. The website resolves it relative to `BOT_DATA_ROOT` (default project root).

## New integration commands

- `.portfolio notifikasi` — private WhatsApp inbox for Designer Studio notifications.
- `.portfolio notifikasi semua` — latest notification history.
- `npm run integration:doctor` — check shared environment, MongoDB target, media path, dependencies and security settings.
- `npm run smoke:deployment` — check bot `/ready` and website `/health`.
- `npm run verify:database` — inspect shared collections and required indexes.

## Rollback

1. Stop both processes.
2. Restore the previous source release.
3. Restore the matching `.env`, auth directory, and media directory.
4. If database schema/data was changed, restore the pre-deployment backup into a staging database first and validate it before any production restore.
5. Never drop the production database as a routine rollback step.
