# Update PIR Visuals Bot to v6.7.0

## 1. Backup and extract
1. Stop the bot and website.
2. Back up source, MongoDB, `.env`, Baileys auth/session, website media, and runtime configuration.
3. Download both v6.7.0 ZIP parts.
4. Extract Part 1, then Part 2 into the SAME destination and merge the shared `PIR-Visuals-v6.7.0/` folder.
5. Copy the merged source into the installed project while preserving local/private files.

## 2. Preserve local files
Do not overwrite `.env`, auth/session folders, backups, `node_modules`, allowlists, custom aliases, bot settings, `content/texts.json`, database dumps, or uploaded media. The release ZIP excludes these files. The main menu now adds a discovery footer in code, so the new `.fitur` entry remains visible even if the runtime menu text is customized. If you want the new `.menu media` and Apple preview wording in a customized `content/texts.json`, merge those specific lines from `content/texts.example.json`; do not replace the entire local file.

## 3. Versions and dependencies
- Node.js 18+ recommended.
- No new runtime npm dependency.
- Bot package: v6.7.0.
- Website package: v3.50.0.

```bash
npm ci
npm ci --prefix portfolio-website
```

## 4. Database compatibility
No new MongoDB collection, index, or destructive migration is introduced in v6.7.0. Existing v6.6.0 data and indexes remain unchanged.

## 5. Generate documentation and run checks

```bash
npm run docs:commands
npm run check
npm run website:check
node --test tests/anime-discovery.test.js tests/music-discovery.test.js tests/media-download.test.js tests/general-help.test.js tests/command-catalog.test.js tests/command-routing.test.js
node --test portfolio-website/tests/command-explorer.test.js portfolio-website/tests/creative-studio-page.test.js
npm run audit:release
npm test
npm run website:test
```

## 6. WhatsApp staging — feature discovery
- Run `.fitur`; verify every category and its command count appears.
- Run `.fitur cari sticker`, `.fitur cari anime populer`, `.fitur cari download musik apple`, and `.fitur cari kolaborasi desainer`.
- Run `.fitur kategori Creative Asset Studio` and `.fitur semua 2`.
- Run `.fitur alur` and `.fitur alur apple-music-preview`.
- Verify `.help assetstudio`, `.help anime`, and `.help music` explain syntax and access boundaries.
- Verify custom PREFIX works for `.fitur` output.

## 7. WhatsApp staging — Anime fallback
- Test `.anime cari Frieren`, `.anime populer`, `.anime musim`, and `.anime detail 52991`.
- Simulate Jikan 429/503 or temporary network failure and verify AniList fallback is used.
- Simulate AniList failure too and verify the bot gives a useful provider/network diagnostic.
- Confirm adult content remains filtered and no stream/download command is offered.

## 8. WhatsApp staging — Apple Music preview
- Open a single song in Apple Music and copy its share link. If using an album URL, ensure it includes `?i=TRACK_ID`.
- Run `.music preview <Apple Music song link>`.
- Run `.dl apple <Apple Music song link>` and `.dl <Apple Music song link>`.
- Verify the bot sends only the preview returned by Apple's public API and includes the preview-only note.
- Test a song without `previewUrl`; the bot must explain that Apple has no public preview.
- Test album-only links, malformed URLs, explicit items, oversized responses, non-audio content types, timeout, and provider 429.
- Verify no full Apple Music stream is accessed and no DRM/subscription restriction is bypassed.

## 9. Website staging
- Verify `/commands` is visible in the primary navigation as **Semua Fitur Bot**.
- Search categories and workflows; confirm generated catalog includes `.fitur`, `.anime`, `.music`, and the Apple preview workflow.
- Test desktop and mobile in Light and Dark Mode.
- Confirm `/creative-studio` explains Apple public previews and Anime provider fallback.

## 10. Rollback
Restore the previous source tree and package versions while preserving the current `.env`, session, database, and uploaded media. No database rollback is required.
