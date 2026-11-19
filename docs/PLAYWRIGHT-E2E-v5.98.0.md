# Playwright E2E — PIR Visuals v5.98.0

Playwright is an optional developer tool. It is deliberately installed only when browser E2E is needed and is not added to production runtime dependencies.

## Install once (network access required)

From the project root:

```bash
npm run e2e:install
```

This installs `@playwright/test` without changing the committed package manifest/lockfile and downloads Chromium.

## Run

Make sure local MongoDB is running and `.env` points to the local database. Then:

```bash
npm run test:e2e
```

By default Playwright starts/reuses the website at `http://127.0.0.1:3010`. It runs desktop Chromium and an iPhone-sized Chromium viewport.

For a seeded public designer profile, set `E2E_DESIGNER_PATH` before running to also test the direct WhatsApp CTA:

PowerShell:

```powershell
$env:E2E_DESIGNER_PATH="/designer/DSN-XXXX"
npm run test:e2e
```

Bash:

```bash
E2E_DESIGNER_PATH=/designer/DSN-XXXX npm run test:e2e
```

If the website is already running on a different address:

```bash
E2E_BASE_URL=http://127.0.0.1:3010 E2E_EXTERNAL_SERVER=true npm run test:e2e
```

The tests use existing local public data but do not create, modify, or delete designer/client records. Workspace access tests intentionally use a non-existent project ID.
