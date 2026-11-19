# Install PIR Visuals Bot v6.7.4 + Website v3.51.0

1. Stop the bot and website processes.
2. Back up the source folder, MongoDB database, `.env`, `auth_info_baileys`, `uploads/portfolio`, and any local runtime data.
3. Extract the release source over the project, but preserve the existing `.env`, `auth_info_baileys`, `uploads`, `backups`, `data`, and other local runtime folders.
4. Keep `MONGO_URI`, `BOT_DATA_ROOT`, and `PORTFOLIO_UPLOAD_DIR` consistent for bot and website. The default shared upload folder is `uploads/portfolio`.
5. Install dependencies from the project root with `npm ci`. If the nested website has a separate `node_modules`, run `npm run website:install` as needed.
6. Run `npm run check` and `npm run website:check`.
7. Run focused tests: `node --test tests/portfolio-svg-upload.test.js tests/website-integration-v539.test.js` and `npm run website:test`.
8. Start the bot with `npm start` and the website separately with `npm run website`.
9. In a private WhatsApp chat, run `.portfolio add`, send a small SVG as a Document, then complete title/category/description. Confirm the work appears as pending in Owner moderation.
10. In Designer Studio, upload a small SVG and confirm the same moderation queue and public WebP preview after approval.

## Safety
- Do not overwrite `.env`, WhatsApp auth/session folders, database contents, uploaded media, backups, or local data.
- SVGs are sanitized by validation and converted to WebP. The original SVG source is not served publicly.
- Each file is limited to 15 MB. Website uploads allow up to five files per work; WhatsApp wizard accepts one file per command.
