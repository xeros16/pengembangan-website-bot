# QA Report — PIR Visuals v5.87.0

## Release scope

Backend operational stability, bot health monitoring, backup validation and retention, Designer Studio activation/OTP controls, public profile metadata and regression repair.

## Automated test results

| Check | Result |
|---|---:|
| Root test suite (`npm test`) | **416 passed / 0 failed** |
| Website test suite (`npm run website:test`) | **364 passed / 0 failed** |
| Root syntax check (`npm run check`) | **216 JavaScript files passed** |
| Website syntax check (`npm run website:check`) | **Passed** |

## Baseline failures resolved

The previous release had ten known root-suite failures. All ten now pass:
1. Backup validates database dump, includes manifest and optional local state.
2. Backup retention is bounded and overlapping jobs are skipped.
3. Bot exposes a local-only readiness endpoint for MongoDB and Baileys state.
4. WhatsApp connection lifecycle updates health state.
5. WhatsApp setup token is issued only for the profile owner.
6. Activated designer accounts receive short-lived WhatsApp OTPs.
7. Designer profile schema supports verification, featuring, language and watermark preferences.
8. Profile formatter visibly marks verified and featured designers.
9. Public portfolio server exposes profile, media, QR and direct contact routes.
10. Portfolio commands expose website, QR, analytics, language and watermark controls.

The older ten baseline failures have therefore been resolved at the automated test level; this release has no failing automated tests in either suite.

## Additional v5.87 regression coverage

- Backup manifest is written only after a non-empty BSON dump is verified.
- Backup retention checks the generated directory prefix and parent path before deleting old backups.
- Optional local state backup is disabled by default to avoid copying WhatsApp credentials unintentionally.
- Health server rejects non-loopback bind addresses and distinguishes liveness from readiness.
- Designer activation token is issued only in a private chat after finding the profile by the requester's owner JID.
- Activation token hash is stored and expires after 20 minutes.
- WhatsApp OTP uses cryptographic random integer generation and a five-minute expiry.
- Profile commands include Owner-only verified/featured controls.
- Public profile media checks the designer watermark preference.
- Canonical `/designer/:id`, `/p/:slug`, QR, contact and media paths remain covered.

## Manual / staging checks still required

This QA environment does not have access to the deployment's live MongoDB, mongodump binary, SMTP provider, WhatsApp credentials, public TLS certificate or reverse-proxy configuration. The following must be tested in staging before production:
1. Run a real mongodump, inspect backup-manifest.json and restore the dump into a disposable database.
2. Enable BACKUP_INCLUDE_LOCAL_STATE only if the backup directory is private; confirm the Baileys auth folder is protected.
3. Confirm /health and /ready are reachable from the local process monitor but not exposed publicly.
4. Pair WhatsApp and verify the readiness state changes to ready only after MongoDB and WhatsApp are connected.
5. Request a Designer Studio activation token from the profile owner's private chat; confirm a group chat and a different WhatsApp identity cannot request it.
6. Activate a test account, verify the email, request OTP and test expiry / one-time use.
7. Verify the public profile badges, language selection and watermark output in desktop and mobile browsers.
8. Confirm SMTP email delivery and production Secure cookie / proxy behavior.

## Conclusion

v5.87.0 passes all automated root and website suites. The previous ten root-suite baseline failures are resolved. The project is ready for staging validation, not yet certified for production without the manual checks above.
