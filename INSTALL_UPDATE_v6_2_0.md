# Update PIR Visuals Bot to v6.2.0

## 1. Before updating

1. Stop the bot and back up the current source and MongoDB using your normal secure process.
2. Keep `.env`, Baileys auth folders, database dumps, local allowlists, editable `content/texts.json`, local bot settings, and runtime files outside the release source.
3. Extract Part 1 and Part 2 into the same parent folder (for example, Downloads). Both archives contain the same `PIR-Visuals-v6.2.0/` root directory and disjoint file sets, so they merge into one complete folder. Do not extract them into two separate destinations.
4. Back up the old project, then copy the source files from `PIR-Visuals-v6.2.0/` into your project root. Preserve your local `.env`, `auth_info_baileys/`, `config/allowed-chats.json`, `config/command-aliases.json`, `config/bot-settings.json`, and `content/texts.json`.

## 2. Install dependencies

Node.js 18 or newer is required for built-in `fetch`. From the project root run:

```bash
npm ci
```

No new package dependency is introduced by v6.2.0. If you deploy the website separately, its package and runtime remain unchanged.

## 3. Optional menu text merge

The release template `content/texts.example.json` includes a new main-menu entry for `.menu anime`. The local `content/texts.json` is installation-specific and is not overwritten by the release. If you want the new shortcut on your current main menu, add this line to the `mainMenu` value:

```text
🎬 {prefix}menu anime — anime, musik, dan downloader
```

The `.menu anime` route and `.commands anime` category work even if you do not merge the main-menu line.

## 4. Run automated checks

```bash
npm run check
node --test tests/anime-discovery.test.js tests/command-catalog.test.js tests/command-search.test.js
npm run audit:release
```

Run the full suite when all project dependencies are installed:

```bash
npm test
npm run website:check
npm run website:test
```

## 5. Staging acceptance

Using a test WhatsApp account and an allowlisted test chat:

- `.anime help` displays the command guide without calling the provider.
- `.anime cari Frieren` returns a small set of safe-for-work search results.
- `.anime populer` returns a popularity list.
- `.anime musim` returns current-season metadata.
- `.anime detail 52991` returns a detail entry, if the provider still recognizes the ID.
- Invalid IDs and too-short search queries return usage guidance.
- Temporarily block access to `api.jikan.moe` and verify the bot returns a friendly error while other commands continue to work.
- Verify `.help anime`, `.menu anime`, `.commands anime`, `.cari anime populer`, and `.alur anime`.
- Confirm the bot does not send streaming or episode-download links.

## 6. Provider and privacy notes

Anime metadata is retrieved from Jikan, an unofficial public API for MyAnimeList data. The bot stores no user query history; only short-lived in-process response cache entries are kept. Provider availability, data coverage, rate limits, or terms may change. If the API is unavailable, anime discovery is unavailable but other bot functions should continue.

## 7. Rollback

Stop the bot, restore the previous source tree, and restart using the existing local configuration and Baileys session. v6.2.0 adds no database collections, indexes, or persistent user records.

## 8. Release archive security

Release archives exclude `.env`, `creds.json`, Baileys auth folders, `.git`, `node_modules`, backups, uploads, local allowlists, and runtime JSON data. Run `npm run audit:release` before sharing.
