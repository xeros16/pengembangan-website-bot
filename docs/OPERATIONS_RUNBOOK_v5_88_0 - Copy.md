# Operations Runbook — PIR Visuals v5.88.0

## 1. Install and verify dependencies

The release does not add runtime dependencies. Ensure the website package dependencies are installed:

```bash
npm --prefix portfolio-website install
```

This is important for the native image pipeline (`sharp`) and the motion runtime (`gsap`). The smoke test checks both GSAP runtime assets.

## 2. Automated checks

Run from the project root:

```bash
npm run check
npm test
npm run website:check
npm run website:test
```

Expected release baseline:
- Root tests: 416/416.
- Website tests: 374/374.
- Root JavaScript syntax: 217 files.
- Website syntax check: passed.

## 3. Website smoke test

Start the website using the existing process manager. Then run:

```bash
PORTFOLIO_SMOKE_BASE_URL=https://domain-kamu.example npm --prefix portfolio-website run smoke
```

The smoke test checks:
- `/health`
- `/`
- `/robots.txt`
- `/sitemap.xml`
- `/manifest.webmanifest`
- `/sw.js`
- `/vendor/gsap.min.js`
- `/vendor/ScrollTrigger.min.js`
- `/studio`

For optional bot integration:

```bash
PIR_CHECK_BOT_HEALTH=true BOT_HEALTH_URL=http://127.0.0.1:3091/health PORTFOLIO_SMOKE_BASE_URL=https://domain-kamu.example npm --prefix portfolio-website run smoke
```

The bot health endpoint must remain loopback-only. Do not expose port 3091 publicly.

## 4. Private collection management links

- The `?key=` edit URL is a bearer secret. Treat it like a password.
- Do not post it in a public channel or support ticket.
- The edit-key page must return `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, and `X-Robots-Tag: noindex, nofollow`.
- Public collection links without a key may be shared.
- If a management URL is exposed, delete the collection or rotate its management token using an appropriate owner workflow before sharing again.

## 5. Content Security Policy

The shared HTML shell permits:
- same-origin executable scripts and network connections;
- same-origin, data, and HTTPS images;
- same-origin stylesheets and inline styles used by the existing server-rendered UI;
- same-origin form submissions.

Do not reintroduce inline event-handler attributes such as `onclick`, `onerror`, or `onsubmit`. Add interactions to the first-party `public-ui.js` delegated handlers and cover them with tests.

## 6. QR page

The QR page uses the same CSP as the rest of the HTML shell. It permits the same-origin brand icon and HTTPS QR image provider. If the QR provider changes, review the image CSP and keep the target URL escaped in markup.

## 7. Staging release checklist

- Install website dependencies and confirm Sharp/GSAP modules load.
- Run all four automated check commands.
- Run the website smoke test over the production-like HTTPS domain.
- Verify the homepage, directory, profile, case study, QR, contact, collection, Designer Studio, and Client Workspace pages.
- Verify both dark and light themes at desktop, tablet, and mobile widths.
- Verify theme toggle, nav drawer, carousel, favorites, collection reorder, delete confirmation, image fallback, forms, and keyboard focus.
- Confirm a collection edit URL is never publicly cached or indexed.
- Confirm HSTS and Secure cookies appear only under the expected production HTTPS configuration.
- Test live MongoDB, SMTP delivery, WhatsApp pairing/OTP, and backup restoration.
- Only promote to production after the staging report is signed off.
