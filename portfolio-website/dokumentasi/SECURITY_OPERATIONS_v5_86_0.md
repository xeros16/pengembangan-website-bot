# Security Operations — PIR Visuals v5.86.0

## Release scope

This release closes race conditions in Designer Studio account activation and WhatsApp OTP login. It builds on the v5.85 request throttling, safe cookie parsing, constant-time CSRF comparison, email-link confirmation and HTTP hardening. No schema migration or new runtime dependency is introduced.

## Atomic account activation

- The setup token must still match the stored hash and must remain unexpired at the exact moment of the database update.
- The update consumes the setup token and clears its expiry in the same atomic operation that stores the password and email-verification token.
- Concurrent submissions cannot both consume the same setup token.
- A unique-email collision caused by a concurrent activation is returned as HTTP 409.
- Existing email uniqueness is enforced by the MongoDB unique index on the DesignerDashboardAuth email field.

## Single-use WhatsApp OTP login

- Login first verifies the email/password pair and checks that the OTP is active, correctly hashed, unexpired and below the attempt limit.
- Before a session is issued, the website atomically matches the same designer, verified email state, password hash, OTP hash, expiry and attempt limit, then clears the OTP.
- If another concurrent request already consumed the OTP, the compare-and-set update does not match and no session is issued.
- Failed OTP attempts increment only if the same OTP remains active. The update is bounded at five attempts and does not accidentally increment a newly issued OTP.
- Legacy accounts with a missing `otpAttempts` field remain supported by the conditional update.

## Password lifecycle

- Initial password setup clears any stale OTP state.
- Password changes are throttled by IP and designer identity, then compare-and-set against the password hash that was verified. A simultaneous password update cannot silently overwrite a newer password.
- Password changes clear OTP hash, expiry and attempt count.
- Password resets clear OTP state and revoke all Designer Studio sessions.
- Users must request a fresh WhatsApp OTP after changing or resetting their password.

## Existing v5.85 controls retained

- IP and account-identity request throttles cover login, registration, setup, verification, resend, password recovery and Owner Basic Authentication.
- Rate-limit keys are opaque digests and the in-memory bucket map is bounded.
- `cf-connecting-ip` is ignored unless `TRUST_CLOUDFLARE_IP_HEADER=true`; enable it only when the origin accepts traffic exclusively from Cloudflare.
- Duplicate/malformed cookies are rejected; Designer and Client CSRF tokens are compared in constant time.
- Email verification GET displays a confirmation form; the one-time token is consumed only by POST.
- Password reset and email verification tokens are consumed atomically.
- Sensitive token pages use no-store and no-referrer, including invalid password-reset links.
- HTTP request headers, request target and request bodies have explicit limits.
- Browser security headers and object-src denial remain enabled.

## Deployment checklist

1. Back up the project, database and uploads.
2. Stop the running website process.
3. Merge Part 1 and Part 2 archives into the project root.
4. Preserve `.env`, `portfolio-website/.env`, `portfolio-website/models.js`, database contents, uploads/media and WhatsApp auth/session folders.
5. Keep `TRUST_CLOUDFLARE_IP_HEADER=false` unless the origin is protected by a Cloudflare-only firewall.
6. Start the application and check `/health`, `/studio`, `/studio/forgot`, `/discover` and `/client`.
7. On a test account, verify setup, email verification, OTP login, password change and password reset.
8. Request an OTP and attempt two simultaneous logins with the same code; only one request should create a session.
9. Verify a fresh OTP is required after a password change/reset.
10. Confirm HTTPS, SMTP delivery, Secure cookies and reverse-proxy IP handling in production.

## Operational limitations

- The v5.85 in-memory rate limiter remains process-local and resets after a process restart. It is not a shared limiter for multiple Node instances.
- This release is application hardening, not a formal penetration test or third-party security certification.
- The isolated QA environment did not run live MongoDB, SMTP delivery, production TLS/proxy or browser-based concurrent-login tests. Perform these checks in staging before production deployment.
