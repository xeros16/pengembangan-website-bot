# PIR Visuals v5.96.0 — Staging Access Requirements

This checklist identifies the external access needed to complete the staging and stable-release gate. Do not paste passwords, OTPs, MongoDB URIs, API tokens, or WhatsApp credentials into chat.

## 1. Network-enabled Node.js runner

Provide one of:
- A GitHub repository with the source pushed, so `.github/workflows/ci.yml` can run on a hosted runner with npm registry access; or
- A staging server/CI runner with Node.js 22, npm 10+, outbound HTTPS access to `registry.npmjs.org`, and permission to run `npm ci`.

The CI workflow installs the root and website lockfiles independently, then runs syntax checks, release audit, the full bot suite, and the full website suite. It does not require production secrets.

## 2. Staging MongoDB

- Create a dedicated non-production database, e.g. `pir_visuals_staging`.
- Create a database user limited to that staging database.
- Allow network access only from the staging runner/server IPs.
- Store the staging connection string as `MONGO_URI` in the server's secret environment; do not commit it or paste it into chat.
- Use the same root `.env` for the bot and website. Do not set a conflicting website-specific `MONGO_URI`.
- Keep production and staging databases separate. Never run restore drills against production.

## 3. Website environment

Set the values required for the staging environment:
- `PORTFOLIO_PUBLIC_BASE_URL` and `SITE_URL` to the staging HTTPS hostname.
- `PORTFOLIO_UPLOAD_DIR` to a shared writable media directory.
- `DASHBOARD_USER` and a unique `DASHBOARD_PASSWORD` of at least 16 characters.
- SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`) for registration and recovery tests.
- The correct website host/port settings.

Use `.env.example` as the key reference; replace all sample values before starting services.

## 4. WhatsApp test account

- Use a dedicated new test number/account, not a production operator's personal account.
- Pair the staging bot through the QR shown in the staging terminal.
- Keep the Baileys auth directory local to the staging host and excluded from source archives.
- Create a test group and add the test account, a group Admin account, and the bot Owner test account.
- Run onboarding, command permission, private notification, and cross-group isolation scenarios from `docs/STAGING-ACCEPTANCE-v5.96.0.md`.
- Do not share the QR, OTP, auth directory, or session files in chat.

## 5. Backup and restore tools

Install MongoDB Database Tools on the staging host (`mongodump` and `mongorestore`). Back up the database archive and portfolio media directory separately. Restore only into a new staging database namespace and verify representative profile, portfolio, notification, auth, and analytics records.

## 6. Evidence required for Stable Release

- GitHub Actions (or equivalent CI) full bot and website suites pass.
- `npm run integration:doctor` has no errors or unresolved critical warnings.
- `npm run verify:database` confirms expected collections and required indexes.
- `npm run smoke:deployment` reports 2/2 services ready.
- Fresh WhatsApp account completes onboarding and permission tests.
- Website-generated notification is read in private chat and rejected in group chat.
- Backup and restore drill succeeds, including media restoration.
- No open critical/high severity defects remain.

Only after all evidence is recorded should the release be marked Stable.
