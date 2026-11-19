# PIR Visuals Bot v6.0.0 — Bot Experience & Intelligence Upgrade

**Bot package:** 6.0.0  
**Website package:** 3.46.0 (unchanged)  
**Release status:** Development Candidate — local acceptance required.

## Product focus

This release intentionally focuses on the WhatsApp bot. The website is carried forward unchanged. The hybrid product boundary remains: WhatsApp is a designer directory and direct-contact channel; website project workspace is optional. PIR does not add checkout, payment, commission, escrow, or transaction mediation.

## New: Personal Quick Access

- `.cepat` provides a private command center with favorites and recent command history.
- Members can save up to eight public commands using `.cepat tambah <perintah>` and remove them with `.cepat hapus <perintah>`.
- Recent command history is opt-in and OFF by default.
- When enabled, only the canonical top-level public command name is stored; arguments, message text, media, and results are not recorded.
- History is capped at eight unique commands; users can disable or delete it at any time.
- Quick Access screens are private-chat only to prevent preferences or cross-chat command history from being shown in groups.
- Owner-only, admin-only, premium-only, unknown, and navigation-only commands cannot be saved or recorded.
- Preferences use the existing `User.preferences.quickAccess` field; no database migration is needed.

## Bot UX optimization

- Main menu, beginner quick-start, onboarding recommendations, command catalog, and natural-language search now expose Quick Access.
- Search recognizes everyday words such as favorit, pintasan, shortcut, riwayat, and perintah terakhir.
- Tutorial text for Learning Path, Community Challenge, Community Hub, and Design Tutorial now respects a custom command prefix instead of hardcoding `.`.
- Game command metadata is separated from runtime game handlers so catalog/help modules and focused tests do not need to load database-backed game handlers.

## Compatibility and safety

- Existing commands and aliases remain intact.
- No new runtime dependency.
- No schema migration or destructive data operation.
- Recent-history tracking only starts after explicit opt-in and only after a recognized command completes without a thrown error.
- The bot remains text-navigation based for WhatsApp client compatibility.

## Validation

See `QA_REPORT_v6_0_0.md`. Validation completed: syntax scan 258/258, focused regression 85/85, command catalog generation, and release audit passed. Full dependency-backed regression could not run because npm registry DNS resolution failed (`EAI_AGAIN`); live WhatsApp/MongoDB checks remain mandatory on the local machine.
