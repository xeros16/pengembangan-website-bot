# QA Report — PIR Visuals Bot v6.0.0

**Status:** Development Candidate — local acceptance required  
**Bot package:** 6.0.0  
**Website package:** 3.46.0 (unchanged)

## Automated checks completed in this workspace

| Check | Result |
|---|---:|
| JavaScript syntax scan | PASS — 258 files |
| Focused regression suite | PASS — 85/85 tests |
| Command catalog generation | PASS — 168 top-level command names |
| Release security audit | PASS |
| Package/lock version alignment | PASS — 6.0.0 |
| Website package unchanged | PASS — 3.46.0 |

Focused tests cover:
- Quick Access favorites, add/remove, eight-item cap, alias normalization, and custom prefix handling.
- Recent history OFF by default, explicit opt-in/out, eight-entry cap, deletion, and reset.
- Command-name-only storage; no arguments, message content, or media.
- Private-chat-only display, account isolation, MongoDB persistence fallback, and malformed stored preference handling.
- Routing through the command handler, maintenance-mode availability, command catalog, natural-language search, and onboarding discovery.
- Custom prefix rendering in design, Learning Path, Community Challenge, and Community Hub tutorials.
- Lightweight game command metadata completeness and command catalog consistency.

## Checks not completed

`npm ci --no-audit --no-fund` could not complete because this execution environment could not resolve `registry.npmjs.org` (`EAI_AGAIN`). The package's `mongoose` dependency is therefore not installed here.

Consequently:
- The complete `npm test` suite was not run.
- Database-backed runtime registry tests were not run.
- Live MongoDB persistence, WhatsApp message routing, multi-device behavior, and a real private/group chat acceptance test remain unverified.
- This workspace cannot certify a production release.

## Data and compatibility

- Quick Access writes to the existing `User.preferences.quickAccess` Mixed field.
- No schema migration, index creation, data rewrite, or destructive operation is required.
- Recent history is OFF by default and only enabled after `.cepat riwayat aktif`.
- Quick Access views/settings are private-chat only.
- No runtime dependency was added.
- Website package remains unchanged at v3.46.0.
- Bot remains a designer directory and direct-contact channel; no payment, checkout, commission, escrow, or transaction mediation was added.

## Local acceptance gate

Before treating v6.0.0 as stable on the user's machine:

1. Run `npm ci`.
2. Run `npm run check`.
3. Run `npm test` and confirm every test passes.
4. Run `npm run audit:release`.
5. Start the bot against the local MongoDB database and existing WhatsApp session.
6. Test `.cepat`, favorites, history opt-in/out/delete, and private-chat-only behavior from a new WhatsApp test account.
7. Verify existing portfolio directory, Designer Studio, group permissions, moderation, and game commands still work.

Do not label the release Stable until these local checks pass.

## Split ZIP archive verification

- 619 source/project files are included across the two complementary ZIP parts.
- Part 1 contains 311 source files; Part 2 contains 308 source files.
- Both ZIP CRC checks pass and each archive contains no duplicate entry names.
- Extracting both parts into one folder reconstructs all 619 source files with matching SHA-256 hashes.
- `.env`, `.git`, `node_modules`, WhatsApp auth/session state, backups, portfolio media, and local runtime allowlists/settings are excluded.
- The two archives are approximately 6.02 MB and 6.07 MB.
