# PIR Visuals Website v3.51.0 — SVG Portfolio Upload

## Upload Designer Studio
- Designer Studio now accepts JPEG, PNG, WebP, and SVG artwork.
- Per-file upload limit increased from 8 MB to 15 MB.
- Up to five files may be uploaded for one portfolio item; total multipart request limit is 80 MB.
- SVG markup is checked for active content, external resources, DTD/entities, event handlers, and excessive complexity.
- Accepted SVG files are rasterized to optimized WebP previews. Raw SVG markup is not served to public visitors.
- Existing Owner moderation and shared portfolio storage remain unchanged.

## Shared bot upload
- The same `portfolio-media.js` processing pipeline is used by the WhatsApp bot.
- Bot uploads are stored in the same `PORTFOLIO_UPLOAD_DIR` and MongoDB `portfolioitems` collection as website uploads.
