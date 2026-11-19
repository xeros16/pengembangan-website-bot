# Install PIR Visuals Bot v6.7.6 + Website v3.53.0

1. Stop the bot and website.
2. Back up source, MongoDB, `.env`, WhatsApp auth/session folders, `uploads/portfolio`, backups and runtime data.
3. Extract the new bot release over the existing project, preserving `.env`, `auth_info_baileys`, `uploads`, `backups`, `data` and other runtime folders.
4. Keep `MONGO_URI`, `BOT_DATA_ROOT` and `PORTFOLIO_UPLOAD_DIR` the same between bot and website.
5. Run `npm ci` in the bot root.
6. Run `npm ci` in `portfolio-website` so Sharp installs the correct native binary for the Windows host. If the Sharp module still cannot load, run `npm rebuild sharp` in that folder.
7. Run `npm run check` in the bot root and `npm run website:check`.
8. Run `npm run check` in `portfolio-website`.
9. Restart bot and website.
10. Hard-refresh the browser with `Ctrl + Shift + R`.

## What to test
- Select a PNG/JPG/WebP profile photo: preview should appear immediately; Save profile should store it.
- Select a Figma SVG: preview tries the original vector first. If browser rasterization is unsupported, the original SVG is still submitted to the server.
- Click Analytics, Portfolio, and Availability in the Workspace sidebar: the viewport should move to each matching section below the sticky header.

## Limits
- Portfolio work: up to five files, 15 MB each, 80 MB per request.
- Profile photo: one JPG/PNG/WebP file, 5 MB maximum.
- Portfolio SVG processing on the server requires the Sharp native runtime for the host OS. Run `npm ci` in `portfolio-website` on the Windows machine.
- New portfolio works remain pending Owner moderation.
