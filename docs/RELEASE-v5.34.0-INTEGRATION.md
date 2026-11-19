# PIR Visuals v5.34.0 — Windows Integration Validation

## 1. Configure both processes
- Bot and website must use the same MongoDB database name in `MONGO_URI`.
- Bot and website must resolve `PORTFOLIO_UPLOAD_DIR` to the same physical directory.
- Keep `BOT_HEALTH_HOST=127.0.0.1` and `BOT_HEALTH_PORT=3091`. The bot endpoint intentionally refuses non-loopback bind addresses.
- Do not copy `.env`, Baileys auth, MongoDB dumps or backup folders into public storage.

## 2. Run configuration doctor
From the project root:

```powershell
npm run doctor:integration
```

Resolve every `ERROR`. Review warnings for SMTP and dashboard credentials. The doctor prints paths and database names but never prints connection strings or passwords.

## 3. Start MongoDB and bot
Start local MongoDB, then in the project root:

```powershell
npm ci
npm start
```

Wait for Baileys to show that it is online. Check the local endpoint:

```powershell
Invoke-RestMethod http://127.0.0.1:3091/health
```

Expected:
- `ok: true`
- `database: connected`
- `whatsapp: open`

If WhatsApp has not connected or MongoDB is down, endpoint returns HTTP 503.

## 4. Start website
In a second PowerShell window:

```powershell
cd portfolio-website
npm install
npm start
```

## 5. Run website smoke test
Basic website-only check:

```powershell
npm run smoke
```

Cross-process bot + MongoDB + website readiness check:

```powershell
$env:PIR_CHECK_BOT_HEALTH = "true"
$env:BOT_HEALTH_URL = "http://127.0.0.1:3091/health"
npm run smoke
```

This verifies both processes are ready. It does not send WhatsApp messages or mutate portfolio data.

## 6. Manual functional acceptance test
Use a test designer and test database:
1. Create/activate a designer through the existing WhatsApp workflow.
2. Complete Designer Studio activation and login.
3. Edit profile, specialties, services, price and public slug.
4. Upload an image, submit it for moderation, approve it in Owner Dashboard.
5. Confirm the public directory and designer page show the approved work.
6. Open the contact link and confirm it targets the designer's WhatsApp number.
7. Confirm pending/rejected work is not shown publicly.
8. Confirm the analytics counters update.
9. Restart bot and website and verify profile and media still load.

## 7. Important limits
- The health endpoint is local-only and intentionally not exposed to the internet.
- The automated smoke check verifies process readiness and public HTTP routes, not a full live Baileys message exchange.
- Actual WhatsApp message delivery requires a linked WhatsApp account, network access and manual acceptance testing.
- Run all tests against a staging database before production.
