# Install PIR Visuals Bot v6.7.5 + Website v3.52.0

1. Stop the bot and website processes.
2. Back up source code, MongoDB, `.env`, `auth_info_baileys`, `uploads/portfolio`, backups and local runtime data.
3. Extract the release source over the project. Preserve `.env`, `auth_info_baileys`, `uploads`, `backups`, `data`, and other runtime folders.
4. Keep `MONGO_URI`, `BOT_DATA_ROOT`, and `PORTFOLIO_UPLOAD_DIR` consistent between bot and website.
5. In the bot root, run `npm ci`.
6. In `portfolio-website`, run `npm ci` so Sharp installs the native runtime for the Windows computer. If Sharp still reports a missing platform binary, run `npm rebuild sharp`.
7. Run `npm run check` in bot root and `npm run website:check`.
8. In `portfolio-website`, run `npm run check`.
9. Restart bot and website.
10. Hard refresh Designer Studio with `Ctrl + Shift + R`.
11. Test a 10–14 MB SVG from Figma. The preview should render; the website converts it to WebP/PNG before upload.
12. Test profile photo upload with a JPG/PNG/WebP file under 5 MB and save the profile.
13. Test `.portfolio add` in a private WhatsApp chat with an SVG sent as a Document.

## Runtime data
Do not overwrite `.env`, WhatsApp auth/session folders, MongoDB contents, uploaded media, backups or local data.

## Limits
- Portfolio website: five files per work, 15 MB per file, 80 MB total request.
- WhatsApp portfolio bot: one file per `.portfolio add`, 15 MB maximum.
- Profile photo: one JPG/PNG/WebP file, 5 MB maximum.
- All portfolio works remain pending until Owner moderation.
