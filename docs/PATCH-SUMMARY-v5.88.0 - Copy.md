# PIR Visuals v5.88.0 — QA & Release Hygiene Patch

Basis: the newly uploaded source snapshot, platform v5.88.0 and website package v3.42.0.

## Changes
- Updated the legacy Customer Support clipboard test to verify the current optional Clipboard API path and `document.execCommand('copy')` fallback. No production website interaction code changed.
- Strengthened `scripts/audit-release.js` to reject local allowlist backups, custom command aliases, and bot settings.
- Added `npm run audit:release` and regression tests for the release audit.
- Synchronized QA counts and runtime limitations across the QA report, operations runbook, install note, release notes, and changelog.
- Marked the old v5.19–v5.23 roadmap as historical so it is not mistaken for the active v5.88.0 finalization path.
- Updated the website README version metadata to v3.42.0 / platform v5.88.0.

## Validation
- Root tests: 421/421 passed.
- Website tests: 384/384 passed.
- Root JavaScript syntax: 221 files passed.
- Website syntax check: passed.
- Release archive audit: passed on the clean source staging directory.

## Not certified yet
Live MongoDB, WhatsApp pairing/OTP, SMTP delivery, TLS/reverse proxy, real browser visual interactions, native Sharp image processing on the target OS, and backup restoration still require staging verification.

## Distribution safety
The clean source ZIP excludes `.env`, WhatsApp sessions, backups, `.git`, `node_modules`, local allowlist/alias/settings data, temporary media, and local runtime history. It retains `.env.example` files. Preserve existing local configuration and user data during updates.
