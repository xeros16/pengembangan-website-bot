# QA Report — PIR Visuals v5.86.0

## Scope

- Atomic Designer Studio setup-token consumption.
- Duplicate-email conflict handling during concurrent activation.
- Atomic WhatsApp OTP consumption before session creation.
- Bounded failed OTP increments.
- Password-change IP/designer throttles and compare-and-set against the current password hash.
- OTP invalidation after initial setup, password change and password reset.
- Regression coverage for v5.85 security controls.
- Release metadata, service-worker cache and syntax-check coverage.

## Results

| Check | Result |
|---|---:|
| Website automated tests | **362 passed / 0 failed** |
| Root JavaScript syntax check | **215 files passed** |
| Website syntax check (`server.js`, `security.js`, `models.js`) | **Passed** |
| Root automated tests | **397 passed / 10 failed** |
| New root-suite failures vs v5.85 baseline | **0** |

The same ten root-suite failures recorded in the previous baseline remain:

1. Backup validates database dump, includes manifest and optional local state.
2. Backup retention is bounded and overlapping backup jobs are skipped.
3. Bot exposes local-only readiness endpoint for database and Baileys state.
4. WhatsApp connection lifecycle updates health state.
5. WhatsApp bot issues one-time setup token only for profile owner.
6. WhatsApp bot issues short-lived OTP for activated designer accounts.
7. Designer profile schema supports verification, featuring, language and watermark preferences.
8. Profile formatter visibly marks verified and featured designers.
9. Public portfolio server includes public profile, media, QR and direct contact routes.
10. Portfolio commands expose website, QR, analytics, language and watermark controls.

The failing test names match the v5.85 baseline exactly; no additional root-suite failure was introduced by this release.

## Regression coverage added

- Setup token compare-and-set includes the stored token hash and unexpired timestamp.
- Duplicate-key email collisions are handled as a conflict.
- Login OTP consumption includes the same account, password hash, OTP hash, expiry and attempt bound.
- A failed atomic OTP consume returns without issuing a session.
- Password setup, change and reset clear all outstanding OTP state.
- Password changes are throttled and cannot overwrite a concurrent newer password.
- Existing email-link scanner protection, rate limits, CSRF checks, cookie parser and HTTP bounds remain covered.
- Release metadata and cache-busting assertions are updated to platform 5.86.0 / website 3.40.0 / public cache v37 / asset suffix 5860.

## Environment limitations

No live MongoDB, SMTP, production reverse proxy/TLS, WhatsApp connection or browser automation was available for this isolated run. The atomic MongoDB update behavior is covered by source-level regression assertions; verify it with two concurrent requests against staging before production rollout.

## Conclusion

The website test suite and syntax checks pass. Root test failures are unchanged from the recorded baseline. v5.86.0 is ready for staging validation; production rollout should follow successful live OTP concurrency and account activation checks.
