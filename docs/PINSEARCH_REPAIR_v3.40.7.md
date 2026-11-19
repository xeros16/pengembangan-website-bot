> **Catatan historis:** Dokumen ini menjelaskan implementasi lama. Mulai v3.40.1, `.pinsearch` hanya membuat tautan pencarian Pinterest; tidak menggunakan API, scraping, atau pengiriman gambar otomatis.\n\n# PinSearch Repair v3.40.7

## Perubahan
- Pinterest CDN candidates are now merged from structured Pin JSON and image URLs embedded elsewhere in the same Pinterest HTML page.
- The previous implementation used the broad CDN URL extraction only when structured extraction returned zero results. A single structured thumbnail could therefore prevent other page candidates from being considered.
- The downloader continues through candidates when a thumbnail is too small or a download fails.
- Pinterest remains Pinterest-only. No Bing fallback was added; `.bingsearch` remains separate and unchanged.
- Existing URL-based cross-command duplicate history remains unchanged.

## Files
- `features/commands/pinterest-search.js`
- `tests/pinterest-search.test.js`

## Install
1. Stop the bot with `Ctrl+C`.
2. Back up the two files listed above.
3. Extract this ZIP into the project root and overwrite those files.
4. Run `node --test tests/pinterest-search.test.js`.
5. Run `npm run check`, then `npm start`.

## Example
- `.pinsearch Yae Miko` — up to one valid, new Pinterest image.
- `.pinsearch Yae Miko 3` — up to three valid, new Pinterest images.
- `.bingsearch Yae Miko` — remains a separate Bing Images command.

## Limitations
Pinterest may return login/challenge HTML, incomplete search data, or HTTP 403 from its image CDN. This patch broadens candidate extraction from the returned HTML; it cannot bypass Pinterest access restrictions or guarantee a result when Pinterest does not provide usable candidates.
