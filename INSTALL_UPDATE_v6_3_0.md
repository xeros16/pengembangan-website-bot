# Update PIR Visuals Bot to v6.3.0

## 1. Before updating
1. Stop the bot.
2. Back up the current source and MongoDB using your normal secure process.
3. Keep `.env`, Baileys auth folders, database dumps, local allowlists, local bot settings, `content/texts.json`, and runtime files outside the release source.
4. Extract Part 1 and Part 2 into the same parent folder. Both archives use the same `PIR-Visuals-v6.3.0/` root and contain disjoint project files plus repeated installation notes. Extract Part 2 into the same destination as Part 1.
5. Copy the merged project source into your existing project folder. Preserve local configuration and session files.

## 2. Runtime
- Node.js 18+ is recommended for built-in `fetch` and `AbortSignal.timeout`.
- No new runtime package dependency or database migration is introduced.
- Music Discovery requires outbound HTTPS access to `itunes.apple.com`.
- Existing `.song` download still requires the configured Python + yt-dlp and FFmpeg installation.

## 3. Optional menu text merge
The release template `content/texts.example.json` now includes `.menu musik` and `.asisten` shortcuts. Do not overwrite the local `content/texts.json`. If you want the new shortcuts in the current main menu, merge the relevant lines manually.

## 4. Checks
```bash
npm run check
node --test tests/music-discovery.test.js tests/pir-assistant.test.js tests/command-catalog.test.js tests/command-search.test.js tests/command-routing.test.js tests/media-download.test.js
npm run docs:commands
npm run audit:release
```
When all dependencies are installed:
```bash
npm test
npm run website:check
npm run website:test
```

## 5. Staging acceptance
- `.asisten` returns a primary recommendation and related commands for natural-language needs.
- `.asisten` does not execute commands or respond to ordinary uninvoked messages.
- `.music cari`, `.music album`, `.music artis`, and `.music detail` return expected metadata and Apple links.
- Explicit results are filtered.
- `.menu musik`, `.menu anime`, `.alur musik`, `.help music`, and `.help asisten` are discoverable.
- `.song` search still works with local yt-dlp; selected audio is sent through the existing queue and size limits.
- Block `itunes.apple.com` temporarily and confirm only Music Discovery fails gracefully; other bot features continue.
- Verify configured custom prefix in all menu/help output.

## 6. Privacy and copyright
- Music Discovery stores no query history and does not send audio previews.
- Search terms are sent to Apple's public iTunes Search API.
- `.song` and `.dl audio` must be used only for content the user owns or is authorized to download.
- Existing inbound allowlist and command permissions remain authoritative.

## 7. Rollback
Stop the bot, restore the previous source tree, and restart with the existing local configuration and Baileys session. No database migration is required.

## 8. Release packaging
The release archives exclude `.env`, credentials, Baileys auth folders, `.git`, `node_modules`, backups, uploads, local allowlists, and runtime JSON data. Run `npm run audit:release` before sharing.
