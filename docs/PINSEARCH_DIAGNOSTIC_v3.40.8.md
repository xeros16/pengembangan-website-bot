> **Catatan historis:** Dokumen ini menjelaskan implementasi lama. Mulai v3.40.1, `.pinsearch` hanya membuat tautan pencarian Pinterest; tidak menggunakan API, scraping, atau pengiriman gambar otomatis.\n\n# PinSearch Diagnostic Guard v3.40.8

This patch addresses the observed repeated 256x256 Pinterest CDN URL by distinguishing
real structured Pin image records from arbitrary image URLs embedded in the page.

## Changes
- Adds `extractPinterestStructuredImageUrls()` to identify image URLs attached to Pinterest Pin records.
- Logs one diagnostic line with query, HTTP status, final host, HTML byte count, page title, structured image count, total candidates, and common challenge/login signals.
- Rejects generic `i.pinimg.com` URLs when the page contains no structured Pin image data. This prevents a login/challenge shell or generic page asset from being treated as a search result.
- Keeps `.pinsearch` Pinterest-only. `.bingsearch` is unchanged and is not used as a fallback.
- Adds regression tests for generic CDN assets without Pin records.

## Install
1. Stop the bot (`Ctrl+C`).
2. Back up the two files below.
3. Extract this ZIP into the project root and overwrite:
   - `features/commands/pinterest-search.js`
   - `tests/pinterest-search.test.js`
4. Run:
   `node --test tests/pinterest-search.test.js`
5. Run:
   `npm run check`
6. Restart with `npm start`.
7. Run `.pinsearch Yae Miko` and copy the `[PINSEARCH DIAGNOSTIC]` line from the terminal.

## Important limitation
This is a diagnostic/false-positive guard, not a Pinterest access bypass. If Pinterest returns a login page,
challenge page, restricted response, or no structured Pin records, the bot cannot legitimately infer
the missing Pin results from a generic CDN icon. The diagnostic line will show what Pinterest actually
returned so the next fix can be based on evidence. No Bing results are mixed into Pinterest search.
