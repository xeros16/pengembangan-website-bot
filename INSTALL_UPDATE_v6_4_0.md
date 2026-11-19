# Update PIR Visuals Bot to v6.4.0

## 1. Backup and extract
1. Stop the bot and website.
2. Back up the source folder, MongoDB database, local `.env`, Baileys auth/session directory, and website media.
3. Download both ZIP parts.
4. Extract Part 1, then extract Part 2 into the SAME destination and merge the shared `PIR-Visuals-v6.4.0/` folder.
5. Copy the merged source into the installed project. Preserve local configuration and session data.

## 2. Preserve local files
Do not overwrite or distribute:
- `.env`, `auth_info_baileys/`, database dumps, backups, `node_modules/`
- `config/allowed-chats.json`, `config/command-aliases.json`, `config/bot-settings.json`
- `content/texts.json` (merge new menu lines manually if desired)
- runtime files, uploaded media, or private allowlists

## 3. Runtime and dependencies
- Node.js 18+ recommended.
- No new npm dependency.
- Bot uses Python + yt-dlp; FFmpeg is required for audio extraction/compression. FFprobe is optional for audio metadata.
- Website package is now 3.47.0 and must be updated with this release if the `/commands` page is required.

Install dependencies in the existing project:
```bash
npm ci
npm ci --prefix portfolio-website
```

## 4. Database indexes
The new `DesignBattle` collection is additive. Run with a valid staging/production `MONGO_URI`:
```bash
npm run db:ensure-shared-indexes
npm run verify:database
```
No existing user or submission records are deleted. `LearningSubmission.challengeMode` additionally accepts `battle`.

## 5. Generate docs and checks
```bash
npm run docs:commands
npm run check
node --test tests/design-learning.test.js tests/design-community.test.js tests/moderation-overview.test.js tests/media-download.test.js tests/design-battle-model.test.js
npm run website:check
npm run website:test
npm run audit:release
```
Full suites:
```bash
npm test
```

## 6. WhatsApp staging acceptance
- `.designcommunity ringkasan` only returns the requesting member's current-group summary and no JID/phone.
- Admin creates a battle; members submit; gallery and peer feedback are group-scoped.
- One entry per member per battle; late entries are rejected; closed battle still exposes gallery/results.
- Non-admin cannot create/close battles or apply safety presets.
- `.modstatus` is read-only.
- `.modpreset preview` makes no database changes; apply requires exact `konfirmasi`, the same Admin's preview within five minutes, and unchanged settings.
- `.dl status` shows active phase; `.dl cancel` aborts only the requester's queued/active subprocess.
- Network/429 retry happens at most once; 403/private/unsupported errors are not retried.
- FFprobe metadata is optional and audio MIME mapping matches file extension.

## 7. Website staging acceptance
- Visit `/commands`; search by term and filter by category.
- Copy example button copies the selected command example in a secure browser context.
- Website navigation includes Command Explorer.
- Verify light/dark theme, mobile layout, CSP/security headers, and cache epoch v43.
- `docs/commands.json` is generated and packaged.

## 8. Rollback
Stop bot and website, restore the previous source tree and matching package versions, and retain the database. The new `designbattles` collection and additive indexes can remain during rollback; older bot code ignores them. Do not drop indexes or delete records as part of rollback.
