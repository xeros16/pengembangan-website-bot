PIR Visuals v5.98.0 — Parts Guide

Part 1 and Part 2 are complementary source archives. Extract BOTH into the SAME folder.
Neither part is a standalone installation.

Source files in manifest: 599
Part 1 source files: 301
Part 2 source files: 298
Each source file appears exactly once across the two archives. The SHA-256 manifest
contains the hash and uncompressed size for every source file.

Release contents include:
- Bot v5.98.0 and website v3.45.0
- Explicit opt-in WhatsApp push notifications and private outbox worker
- Client workspace access revocation and privacy controls
- Optional Playwright browser E2E harness
- MongoDB + portfolio-media backup/restore verification
- Additive shared database index setup and verifier

Important documents:
- RELEASE-NOTES-v5.98.0.md
- QA_REPORT_v5_98_0.md
- INSTALL_UPDATE_v5_98_0.md
- OPERATIONS_RUNBOOK_v5_98_0.md
- docs/NOTIFICATION-PUSH-v5.98.0.md
- docs/PROJECT-WORKSPACE-PRIVACY-v5.98.0.md
- docs/PLAYWRIGHT-E2E-v5.98.0.md
- docs/BACKUP-RESTORE-VERIFICATION-v5.98.0.md

Production readiness remains CONDITIONAL until the local Playwright, WhatsApp, MongoDB,
and backup/restore acceptance checks pass.
