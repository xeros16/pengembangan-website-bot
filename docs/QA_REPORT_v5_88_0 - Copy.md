# QA Report — PIR Visuals v5.88.0

## Release objective

Final audit and release-candidate hardening. Scope was limited to correctness, browser security policy, private-link handling, endpoint behavior, test coverage, and deployment smoke checks. No new product feature scope was added.

## Findings fixed

### 1. CSP blocked inline browser event handlers

The shared HTML shell applies a restrictive Content Security Policy. Several generated templates still contained inline `onclick`, `onerror`, and `onsubmit` attributes. Those handlers are not permitted by the policy and therefore could fail silently in real browsers.

**Fix**
- Removed inline event-handler attributes.
- Added delegated same-origin handlers for image fallback, copy/select-link behavior, and delete confirmation.
- Added an explicit `script-src 'self'` policy and same-origin `connect-src`.
- Kept inline style attributes supported because the website currently uses them for layout and component-specific styling.

### 2. Private collection edit links could receive public cache/index policy

A public collection opened with a valid `?key=` edit token was previously eligible for `public, max-age=60`. That response contains owner edit controls and the bearer edit key. The same route also inherited a less restrictive referrer policy.

**Fix**
- Any collection response containing an edit key is `Cache-Control: no-store`.
- Edit-key pages receive `Referrer-Policy: no-referrer`.
- Edit-key pages receive `X-Robots-Tag: noindex, nofollow`.
- Collection creation responses that reveal the one-time management URL receive the same no-store/no-referrer/noindex policy.
- Post-update responses remain no-store/no-referrer.
- Public collection pages without a key remain eligible for the existing 60-second public cache.

### 3. QR page had an incomplete image CSP

The QR page had a custom `img-src` policy that allowed the external QR provider but excluded the same-origin brand icon.

**Fix**
- QR page now uses the shared `sendHtml()` helper and its security headers.
- Shared CSP permits same-origin, data, and HTTPS images.
- Target URL is escaped in the HTML link attribute and text.

### 4. Health endpoint accepted non-read methods

**Fix**
- `/health` now accepts GET and HEAD only.
- Other methods receive 405 with an Allow header.
- HEAD returns headers without a response body.

### 5. Deployment smoke checks did not verify motion runtime assets

**Fix**
- Smoke test now checks both GSAP and ScrollTrigger endpoints.
- This catches incomplete website dependency installation before the release is exposed to users.

## Automated results

| Check | Result |
|---|---:|
| Root suite (`npm test`) | **416 passed / 0 failed** |
| Website suite (`npm run website:test`) | **376 passed / 0 failed** |
| Root syntax (`npm run check`) | **217 JavaScript files passed** |
| Website syntax (`npm run website:check`) | **Passed** |
| Final audit HTTP checks | **12 passed / 0 failed** |

The final audit HTTP suite starts the local website server with mocked model responses and a test-only Sharp loader. It validates response headers, public information routes, collection edit-key caching, QR page CSP, health method handling, and first-party script parsing. It does not validate live database behavior or image transformations.

## Theme contrast spot check

Contrast was calculated from the final universal theme tokens:

| Theme | Pair | Contrast |
|---|---|---:|
| Light | Body text / background | **13.50:1** |
| Light | Muted text / background | **6.59:1** |
| Light | Primary button text / button | **6.12:1** |
| Dark | Body text / background | **16.08:1** |
| Dark | Muted text / background | **9.96:1** |
| Dark | Primary button text / button | **7.40:1** |

All checked pairs exceed WCAG AA's 4.5:1 normal-text threshold. This is a token-level spot check, not a full pixel-by-pixel audit of every dynamic CMS color combination.

## Environment limitations and staging requirements

The following checks could not be certified in this QA container:

1. Live MongoDB was unavailable. Database reads, writes, indexes, and restore behavior must be tested against a staging database.
2. Native Sharp and GSAP packages were not present in the current `node_modules` environment. The HTTP test uses a test-only Sharp stub and does not exercise image processing. Run `npm --prefix portfolio-website install` on the target server and verify both vendor assets.
3. Chromium headless screenshot automation did not complete in the container. Desktop/mobile visual rendering and actual pointer/keyboard interactions require browser staging verification.
4. SMTP delivery, WhatsApp pairing/OTP, reverse-proxy TLS, HSTS, and production cookie behavior remain unverified.
5. A real MongoDB backup/restore drill remains required before production.

## Release assessment

**Automated test status: green.**

v5.88.0 is a release candidate ready for staging. It is not certified as production-ready until the live integrations, native media dependencies, and real-browser checks above pass.
