# Update PIR Visuals Bot to v6.7.2

## Before updating

1. Stop the bot process.
2. Back up your current project and MongoDB database.
3. Keep your existing `.env`, WhatsApp auth/session directory, `content/texts.json`, local uploads, and database data. Do not overwrite them with sample files.
4. Download both ZIP parts and extract them into the same destination, merging the shared `PIR-Visuals-v6.7.2/` folder.

## Install

```bash
npm ci
npm ci --prefix portfolio-website
```

For Voice Lab, install FFmpeg and verify it is available:

```bash
ffmpeg -version
```

On Linux, install FFmpeg through your distribution's package manager. On Windows, add the FFmpeg `bin` directory to `PATH`, then restart the terminal/service.

## Verify

```bash
npm run check
npm run website:check
npm run docs:commands
npm run audit:release
npm run doctor
```

## Start

```bash
npm start
```

If hosting the website separately:

```bash
npm run website
```

## Try the new features

- Send a WhatsApp voice note, reply with `.bass` or `.8d`.
- Reply with `.voice help` to see the effect list.
- Try `.tempo 1.25` while replying to audio.
- Try `.cuaca Bandung` and `.gempa` in WhatsApp.

## Operational notes

- Voice Lab needs FFmpeg. It does not need a new API key.
- Weather uses Open-Meteo; earthquake information uses BMKG. The production host needs outbound internet access.
- No new MongoDB collection or index is introduced.
- Keep credentials, auth sessions, local content, and user data from your existing installation.
- Run live WhatsApp and external-provider smoke tests before returning the bot to production traffic.
