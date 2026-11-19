# PIR Visuals Bot v5.18.0 — Release Notes

Fokus: Game Center UX documentation and audit baseline.

## Included
- Central guide for six primary games: Pixel Realm, Tebak-Tebakan Multikategori, Tebak Angka, Acak Kata, Misteri & Detektif, and Multiplayer.
- Distinction between primary games and supporting player/mission systems.
- QA checklist for command help, configured prefix, game flows, multiplayer roles, MongoDB persistence, and WhatsApp staging.
- Chat history and changelog updated.

## Validation
- `npm run check`: passed — 147 JavaScript files.
- `npm test`: not run — dependencies are not installed in this clean worktree.
- WhatsApp staging and MongoDB integration: not run.

## Upgrade safety
This clean source archive intentionally excludes `.env`, WhatsApp authentication/session folders, `.git`, `node_modules`, runtime data, private uploads, and local allowlists. Back up the live installation first. Preserve local `.env`, auth/session, database, allowlist, aliases, active content, uploads, and runtime data when upgrading; do not overwrite them with the archive. Install dependencies with `npm ci`, configure environment locally, then run `npm run check` and `npm test` before starting.

Do not reuse credentials or WhatsApp session files from an archive that has been shared outside a trusted environment. Re-link WhatsApp after securing the session and rotate exposed secrets.
