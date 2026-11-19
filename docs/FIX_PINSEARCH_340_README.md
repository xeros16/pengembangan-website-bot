> **Catatan historis:** Dokumen ini menjelaskan implementasi lama. Mulai v3.40.1, `.pinsearch` hanya membuat tautan pencarian Pinterest; tidak menggunakan API, scraping, atau pengiriman gambar otomatis.\n\n# PIR Visuals Bot v3.40.0 — Pinterest Pin Search correction

## Root cause addressed
The previous extractor accepted arbitrary Pinterest CDN image URLs and generic page `<img>` tags. A page branding/placeholder image could therefore be selected and sent as if it were a Pin result.

## Correction
- Accept URLs only from structured Pin records that have a Pin identifier/type and an `images` object.
- Parse JSON script payloads and `window.__PWS_DATA__` assignments.
- Reject free-floating CDN URLs, generic `<img>` tags, Open Graph images, branding and placeholders.
- Continue validating the actual downloaded image bytes before sending WhatsApp media.
- If Pinterest does not expose usable public Pin data, return a clear message instead of sending a false result.

Commands remain `.pinsearch <query> [1-5]` and `.pinterest <query> [1-5]`.

## Important limitation
Pinterest may change its public HTML or restrict automated access. This build has fixture-based tests, not a live Pinterest/WhatsApp end-to-end test.
