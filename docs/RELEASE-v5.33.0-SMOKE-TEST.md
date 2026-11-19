# PIR Visuals v5.33.0 — Integration Smoke Test

This release adds a repeatable live HTTP smoke test for the separately deployed portfolio website.

## Start the services
1. Start local MongoDB.
2. Start the WhatsApp bot from the project root (`npm start`) if you need bot/website shared-data verification.
3. In another PowerShell terminal, start the portfolio website:
   ```powershell
   cd portfolio-website
   npm install
   npm start
   ```

## Run website smoke test
With the website running, open another terminal:

```powershell
cd portfolio-website
$env:PORTFOLIO_SMOKE_BASE_URL = "http://127.0.0.1:3080"
npm run smoke
```

The test checks:
- `/health` returns ready and MongoDB connected
- public designer directory responds
- `robots.txt` points to sitemap
- sitemap returns XML
- PWA manifest and service worker are served
- Designer Studio login route responds

A failed health check means the website process may be up but its MongoDB connection is not ready. Do not expose the website publicly until the smoke test passes.

## Release verification
```powershell
npm run check
npm test
```

## Shared-data validation
Create or update a test designer through the existing WhatsApp bot workflow, publish the profile, and verify:
1. It appears in the website directory.
2. Its `/p/<slug>` or `/designer/<id>` page opens.
3. Approved artwork and active services appear.
4. Contact opens the designer's direct WhatsApp number.
5. A hidden profile or pending artwork is not publicly visible.

Do this with a test designer/database before production. The automated smoke test does not create test accounts or modify live MongoDB data.
