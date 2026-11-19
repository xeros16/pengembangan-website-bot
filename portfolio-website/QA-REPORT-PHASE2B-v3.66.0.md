# PIR VISUALS — Phase 2B QA Report

**Release:** v3.66.0  
**Scope:** For Business / public brief intake / Designer Studio authentication UX / Studio logout / client project creation.

## Implemented checks
- Same-origin validation checks browser Origin and Fetch Metadata.
- Public lead submissions are rate-limited by IP, designer, and normalized email.
- Honeypot submissions do not persist leads.
- Optional WhatsApp input is normalized and validated as an international number.
- Partial lead/project/timeline writes are compensated on failure.
- Non-critical designer notification failure no longer invalidates a successfully stored brief.
- Studio logout now requires POST plus a valid designer session CSRF token.
- Login page explains the WhatsApp OTP command, five-minute expiry, and one-time use.

## Automated checks
- Pure lead input and origin helpers have direct unit tests.
- Route and rendered-form regression assertions cover the business flow, Studio login, registration, workspace mutation CSRF, and logout.
- Root `website:check` includes `lead-utils.js`.

## Not covered
- No real MongoDB, SMTP, or WhatsApp integration was exercised.
- No live client lead was submitted.
- No real designer account was logged into or logged out.
- Browser UI automation against the user's localhost was not available in this environment.
- Email invite delivery and WhatsApp OTP delivery still require verification using the user's configured services and a safe test account.

## Known existing historical test mismatch
The older `project-workflow-integration-v5.84` and `security-hardening-v5.86` suites include assertions expecting the platform package version `6.7.2`, while the supplied source project currently declares `6.7.13`. That mismatch predates this patch and was not changed because it would incorrectly downgrade the platform version.
