> **Catatan historis:** Dokumen ini menjelaskan implementasi lama. Mulai v3.40.1, `.pinsearch` hanya membuat tautan pencarian Pinterest; tidak menggunakan API, scraping, atau pengiriman gambar otomatis.\n\n# PinSearch repair patch — PIR Visuals Bot v3.40.1

## What this patch changes
- Reads Pinterest JSON payloads that are nested as a JSON string.
- Reads image variants from Pin records stored in a `pins` map keyed by Pin ID.
- Keeps the strict `i.pinimg.com` host and image-byte validation.
- Does not send a Pinterest search URL as a substitute for an image when extraction or download fails.
- Adds regression tests for the additional JSON shapes and for the no-link failure behavior.

## Install
1. Stop the bot.
2. Back up `features/commands/pinterest-search.js` and `tests/pinterest-search.test.js`.
3. Extract this patch ZIP into the root of your existing bot folder and allow it to replace the two files in their matching paths.
4. Run:
   - `node --test tests/pinterest-search.test.js`
   - `npm run check`
5. Start the bot and test in an allowed test chat:
   - `.pinsearch Yae Miko 3`

## Important limitation
This patch has been tested with local fixtures, not with a live Pinterest/WhatsApp request. Pinterest may block automated requests or change its page structure. If it does not expose Pin image data, the bot now reports that it could not download images instead of replying with a search link or sending a placeholder. A successful live download cannot be guaranteed without testing against the current Pinterest response.
