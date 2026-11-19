# PIR Visuals v5.96.0 — Local Development & Staging

This setup runs the WhatsApp bot, website, and MongoDB on the user's own computer.
No Railway, VPS, public hosting, or cloud MongoDB is required for local functional testing.

## 1. Local architecture

- MongoDB: `mongodb://127.0.0.1:27017/pir_visuals_local`
- WhatsApp bot: local Node.js process; health endpoint `http://127.0.0.1:3091/ready`
- Website: `http://127.0.0.1:3010`
- Both processes load the same root `.env`, use the same MongoDB database, and share `PORTFOLIO_UPLOAD_DIR`.

The website is only available from the same computer while `PORTFOLIO_WEB_HOST=127.0.0.1`.
A local website URL is not publicly reachable by other users on the internet.

## 2. Requirements

- Node.js 22 LTS (Node.js 20 or newer is supported by the application code; use Node 22 for the CI-equivalent environment).
- npm 10 or newer.
- MongoDB Community Server running locally on port `27017`.
- MongoDB Database Tools (`mongodump` and `mongorestore`) for the backup/restore drill.
- A dedicated WhatsApp test account/number. Do not pair a production operator account for initial tests.

Check versions:

```bash
node --version
npm --version
mongosh --version
mongodump --version
mongorestore --version
```

## 3. Start local MongoDB

Install MongoDB Community Server for the computer's operating system and start its local service.

Verify the local database:

```bash
mongosh "mongodb://127.0.0.1:27017/pir_visuals_local" --eval "db.runCommand({ ping: 1 })"
```

Expected result includes `ok: 1`.

If the MongoDB service is not running, start the MongoDB service using the operating system's Services manager or service manager. Do not expose port 27017 to the public internet.

## 4. Configure the project

1. Extract **both** release ZIP parts into the same project folder.
2. Open a terminal in the extracted project root.
3. Copy `.env.example` to `.env`.
4. Keep the local database URI:
   `MONGO_URI=mongodb://127.0.0.1:27017/pir_visuals_local`
5. Set `OWNER_JIDS` to the WhatsApp JID of the test Owner account, for example `628xxxxxxxxxx@s.whatsapp.net`.
6. Change `DASHBOARD_PASSWORD` to a unique password of at least 16 characters.
7. Keep `PORTFOLIO_WEB_HOST=127.0.0.1`, `PORTFOLIO_WEB_PORT=3010`, and `BOT_HEALTH_HOST=127.0.0.1`.
8. Do not share `.env`, QR codes, WhatsApp auth files, or MongoDB credentials in chat.

For the first local run, SMTP can remain blank. Email verification, password recovery, and email notifications that require SMTP will not be testable until an SMTP test account is configured. This does not block bot pairing or basic local website testing.

## 5. Install dependencies

Run these commands from the project root in a terminal with npm registry access:

```bash
npm ci
npm run website:install
```

The website install command uses its committed lockfile (`npm ci`) for reproducible dependencies.

## 6. Run static checks and complete test suites

```bash
npm run doctor
npm run integration:doctor
npm run check
npm run website:check
npm run audit:release
npm test
npm run website:test
```

Do not mark a suite as passed if dependency installation failed or the command did not finish.

## 7. Start bot and website together

```bash
npm run local:start
```

The launcher starts the bot and website as separate child processes while keeping both terminal logs visible. Press `Ctrl+C` once to stop both.

Open:

- Website: `http://127.0.0.1:3010`
- Website health: `http://127.0.0.1:3010/health`
- Bot health: `http://127.0.0.1:3091/ready`

The bot will show the WhatsApp pairing QR when no valid local auth session exists. Scan it only with the dedicated test account. Keep the auth directory on the local computer and do not upload it.

## 8. Verify local integration

In a second terminal at the project root:

```bash
npm run integration:doctor
npm run verify:database
npm run smoke:deployment
```

Expected deployment smoke result: `2/2 services ready`.

Then run the functional acceptance checklist at `docs/STAGING-ACCEPTANCE-v5.96.0.md` using:
- one fresh test member account,
- one test Owner account,
- one test group,
- one group Admin account.

Verify website profile creation/edit, public WhatsApp contact, portfolio upload/moderation, analytics, private `.studio`, and `.portfolio notifikasi`. Confirm the notification inbox is rejected in group chats and cannot read another designer's records.

## 9. Local backup and restore drill

Create a backup directory and dump the local test database:

```bash
mkdir -p backups
mongodump --uri="mongodb://127.0.0.1:27017/pir_visuals_local" \
  --archive="backups/pir-visuals-local.archive.gz" --gzip
```

Back up the `portfolio_uploads` directory separately; MongoDB does not contain the uploaded image bytes.

Create a separate restore-test database and restore into it:

```bash
mongorestore --uri="mongodb://127.0.0.1:27017/pir_visuals_restore_check" \
  --archive="backups/pir-visuals-local.archive.gz" --gzip \
  --nsFrom="pir_visuals_local.*" \
  --nsTo="pir_visuals_restore_check.*"
```

Verify the restored database by temporarily setting `MONGO_URI` to
`mongodb://127.0.0.1:27017/pir_visuals_restore_check` in a separate local test `.env`
or process environment, then run `npm run verify:database`. Do not use `--drop` and do not
restore over the working local database.

## 10. What local testing cannot prove

- A `127.0.0.1` website is not accessible to public customers or remote testers.
- Public email verification/recovery requires valid SMTP.
- Public OAuth/domain verification and HTTPS callbacks require a public domain.
- WhatsApp delivery must be tested using a real test account and internet connectivity.
- Passing local tests does not prove production load, uptime, or external reachability.

## 11. Stable-release gate

Do not mark Stable until:
1. Root and website dependencies install successfully from their lockfiles.
2. Both complete test suites pass.
3. Both local health endpoints return ready.
4. `npm run verify:database` finds no missing required indexes.
5. Fresh WhatsApp onboarding and role/permission tests pass.
6. Website notification is received in private chat and blocked in group chat.
7. Database and media backup/restore are verified.
8. No critical/high severity issues remain.

Record the actual command outputs and test account outcomes in the QA report.
