# Update PIR Visuals Bot to v6.0.0

This release updates the bot package only. The website remains at v3.46.0 and does not need to be replaced for this bot-focused update.

## Before updating

1. Stop the bot process.
2. Make a verified backup of the MongoDB database and local configuration.
3. Keep the current `.env`, `auth_info_baileys/`, `config/allowed-chats.json`, `config/bot-settings.json`, `config/command-aliases.json`, subscription data, and local media/runtime files.
4. Download BOTH ZIP parts and extract them into the same existing project folder. Neither ZIP is standalone.

## Install dependencies

From the project root:

```bash
npm ci
```

No new runtime dependency is introduced, but `npm ci` ensures the lockfile and installed dependencies match.

## Validate before starting

```bash
npm run check
npm test
npm run docs:commands
```

The v6.0.0 Quick Access feature uses the existing `User.preferences` Mixed field. No database migration or index creation is required.

## Start

Use the same local start command and existing `.env` values as before:

```bash
npm start
```

## First-use commands

Send these in a private chat with the bot:

```text
.cepat
.cepat tambah contrast
.cepat tambah wizard
.cepat riwayat
```

Recent-command history is OFF by default. Enable it only if wanted:

```text
.cepat riwayat aktif
```

The history records only public command names, not arguments or message content. All Quick Access screens are private-chat only.

## Rollback

1. Stop the bot.
2. Restore the previous source package from your local copy/backup.
3. Keep the existing `.env`, WhatsApp auth state, database, allowlist, and media unchanged.
4. No data rollback is required for the new feature: `User.preferences.quickAccess` is additive and older code can ignore it.

Do not copy WhatsApp session files, `.env`, database dumps, or secrets into the release ZIP or a chat.
