# Operations Runbook — PIR Visuals v5.89.0

## 1. Install
```bash
npm install
```
No runtime dependency was added. Preserve the existing `.env`, WhatsApp auth folders, MongoDB data, and media uploads when updating an existing installation.

## 2. Validate
```bash
npm run check
npm test
npm run website:check
npm run website:test
npm run audit:release
```

## 3. Test onboarding
In a permitted private chat or group:
1. Send `.mulai`.
2. Choose a goal with a number or natural-language phrase.
3. Choose an experience level.
4. Follow one of the recommended commands.
5. Send `.mulai profil` to see the saved guide, or `.mulai ulang` to change it.
6. Send `.mulai cepat` for a short guide without questions.

Use the configured bot prefix if it is not `.`.

## 4. Test need-based discovery
Try:
```text
.cari bikin poster acara
.cari ubah ukuran foto
.cari belajar desain untuk pemula
.cari mencari jasa desainer
.commands cari aturan grup
```
Search results are suggestions only. The bot never executes a command from search results.

## 5. Data behavior
- Preferences are written to `User.preferences.onboarding` only when `getDbReady()` returns true.
- No schema migration is needed.
- If MongoDB is unavailable, the current process keeps an in-memory fallback. It is not durable across a restart.
- The onboarding conversation itself is held in process memory with a 30-minute inactivity TTL.

## 6. Release packaging
Run `npm run audit:release` before creating a ZIP. Exclude:
- `.env` and `portfolio-website/.env`
- WhatsApp auth/session folders
- MongoDB data and local subscription/history files
- `config/allowed-chats.json`, local backups, and runtime config overrides
- `backups`, `temp`, `uploads`, `.git`, and all `node_modules`

## 7. Staging checklist
- Confirm the configured prefix is reflected in all onboarding replies.
- Test two users onboarding in the same group; answers must not cross sessions.
- Test cancellation and command interruption.
- Confirm MongoDB stores only the onboarding subdocument without replacing other preferences.
- Restart the bot and confirm saved profile loads from MongoDB.
- Verify default group welcome and custom welcome template behavior.
- Verify marketplace/premium/Owner/Admin permission checks are unchanged.
