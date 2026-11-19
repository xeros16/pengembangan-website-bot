# QA Report — PIR Visuals Bot v5.91.0

## Release scope

The WhatsApp bot marketplace is now a portfolio discovery directory with opt-in public designer contact. The bot displays public profiles and approved portfolio work, then lets a prospective client contact the designer directly through the contact details the designer chose to publish.

No bot-mediated brief, offer, bid, order, checkout, payment gateway, manual payment ledger, escrow, commission, delivery approval, revision workflow, transaction rating, or dispute resolution is available in v5.91.0.

The website application was not redesigned or re-scoped in this release. Website syntax and regression tests were run as a compatibility check because the root package version advanced with the bot release.

## Implemented changes

- Reworked the designer profile wizard into five steps: public name, bio, specialties, optional location, optional public WhatsApp.
- Added `publicWhatsApp` to `DesignerProfile`, normalized to 8–15 digits.
- Public WhatsApp is shown only after the designer explicitly enters it. `.portfolio edit whatsapp off` removes it.
- Internal `contactJid` is never used as a public fallback and is not rendered by `formatProfile`.
- Added optional public contact links for Instagram, Behance, Dribbble, and website.
- Removed price prompts and price display from the bot's profile and portfolio discovery flows.
- Removed transaction-rating and order-availability ranking from public discovery.
- Added `.design lokasi <kota>` and expanded text search across approved work and public profile text.
- Search results require approved portfolio work and only include public profiles.
- `.designer DSN-ID` displays approved work and direct contact details.
- `.studio` now shows approved/pending/rejected work counts, profile views, portfolio views, and contact clicks.
- `.marketadmin` now handles directory profiles, pending work, reports, and recent profile/work/report activity.
- Disabled legacy `.requestdesign`, `.client`, `.klien`, `.service`, and `.layanan` workflows with migration guidance.
- Removed active bot imports/handlers for request, offer, service, transaction review, activity, payment, and dispute models. Legacy schemas remain in the model file for historical data preservation only.
- Updated onboarding recommendations, command search synonyms, help, tutorials, command catalog, command docs, README, roadmap, runbook, and release notes.

## Validation results

| Check | Result |
|---|---:|
| `npm run check` | PASS — 225 JavaScript files syntax-checked |
| `npm run website:check` | PASS |
| Focused v5.91 marketplace/onboarding/release tests | PASS — 60/60 |
| `npm run audit:release` | PASS — no `.env`, auth sessions, backups, subscription data, or temporary files detected |
| `npm test` | 391/399 pass; 8 test files could not load because `mongoose` is unavailable in this workspace |
| `npm run website:test` | 372/373 pass; 1 test file could not load because `mongoose` is unavailable in this workspace |
| `npm run docs:commands` | Not run; command-catalog imports the game registry, which requires the unavailable `mongoose` package. `docs/commands.md` was updated manually from the v5.91 catalog changes. |

The eight bot-suite failures and one website-suite failure are dependency-load failures (`ERR_MODULE_NOT_FOUND: mongoose`), not failing assertions in the executed tests. An offline `npm ci` could not complete because the npm cache does not contain `tr46` (`ENOTCACHED`); the online install attempt did not complete within the execution window. Run `npm ci` in an environment with npm registry access before production deployment, then rerun the complete suites.

## Release package

- Clean source contains 532 files and is split into two ZIP archives (Part 1: 268 files; Part 2: 264 files).
- Both archives passed ZIP integrity checks.
- Extracting both into the same folder reconstructed all 532 source files with SHA-256 matches.
- `.env`, `.git`, `node_modules`, WhatsApp auth/session state, backups, and runtime uploads are excluded.

## Not verified in this environment

- WhatsApp live message delivery and actual contact-link tap behavior.
- MongoDB staging reads/writes, index creation, and legacy collection preservation.
- Multi-user profile wizard concurrency against a live database.
- Designer consent comprehension with real community members.
- Website rendering of the new bot-only `publicWhatsApp` field. The bot profile command itself renders the direct WhatsApp link; the website was not changed by this release.
- Production restore from backup and full end-to-end bot startup with installed dependencies.

## Release decision

**Source and package checks: PASS. Production readiness: CONDITIONAL.**

The source is ready for staging. Do not label production integration as verified until dependencies are installed and the live WhatsApp/MongoDB smoke tests in `INSTALL_UPDATE_v5_91_0.md` pass.
