> **Catatan historis:** Dokumen ini menjelaskan implementasi lama. Mulai v3.40.1, `.pinsearch` hanya membuat tautan pencarian Pinterest; tidak menggunakan API, scraping, atau pengiriman gambar otomatis.\n\n# PIR Visuals Bot v3.39.0 — Stage 12 Bug Fixes

## 1. Persistent group allowlist
- The allowlist remains stored in `config/allowed-chats.json` using atomic writes.
- A global MongoDB document is maintained in the `access_lists` collection (`key: global`).
- Startup restores the MongoDB copy. On first startup, the local JSON file seeds MongoDB.
- If MongoDB is temporarily unavailable, local changes remain saved. A newer local file is synchronized when MongoDB reconnects.
- `.allowlist group add/remove` and contact changes wait for the persistence write before reporting the storage result.

**Important:** Keep `MONGO_URI` pointed at a persistent MongoDB database. The collection `access_lists` must not be deleted. If MongoDB is unavailable, local JSON remains the fallback, but container filesystems that are ephemeral can still lose local-only changes.

## 2. Pinterest Pin Search image delivery
- Pin Search reads structured pin image data and escaped image CDN URLs from public Pinterest search pages.
- It validates the image host (`i.pinimg.com`), content type, image signature, redirects and size before accepting a download.
- It downloads the image bytes and sends them as WhatsApp image media with a caption, rather than sending only a URL.
- Public pins only; no Pinterest login, private content, cookies or private API are used.

Commands: `.pinsearch <kata kunci> [1-5]` or `.pinterest <kata kunci> [1-5]`.

## Install
1. Extract both Stage 12 ZIP parts into the same project folder, merging their contents.
2. Run `npm install`.
3. Confirm `.env` has a persistent `MONGO_URI` and valid `OWNER_JIDS`.
4. Run `npm run check`, then `npm test`, then `npm start`.
5. After startup, check logs for `[ACCESS LIST] ...` to confirm the allowlist source and counts.

## Verification
- JavaScript syntax check: 131 files passed.
- Focused allowlist + Pinterest tests: 14/14 passed.
- Full test suite: 139 passed, 5 could not run because `node-fetch` and `mongoose` are absent from this build environment. Install dependencies with `npm install` before deployment.
- No live WhatsApp or production MongoDB end-to-end test was run.
