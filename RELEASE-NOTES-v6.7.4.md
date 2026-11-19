# PIR Visuals Bot v6.7.4 — SVG Portfolio Upload

## WhatsApp portfolio upload
- `.portfolio add` now starts a guided upload flow in private chat.
- Accepts JPEG, PNG, WebP, and SVG documents up to 15 MB per file.
- The wizard collects title, category, and description after the file is received.
- The uploaded work is stored in the shared portfolio directory and `portfolioitems` collection with `moderationStatus: pending`.
- `.cancel` removes a staged file if the upload wizard is abandoned.

## Shared upload pipeline
- Bot and Designer Studio use `portfolio-website/portfolio-media.js`.
- SVG input is checked for scripts, event handlers, DTD/entities, external links/resources, and excessive element complexity.
- SVG is rasterized to WebP before storage. Public routes continue to serve only safe raster media.
- Website uploads accept up to five files per work, 15 MB each, with an 80 MB multipart request cap.
- The bot's general media-download limit is unchanged; only the portfolio upload flow opts into 15 MB.

## Data and moderation
- Bot and website share `PORTFOLIO_UPLOAD_DIR` and the MongoDB `portfolioitems` collection.
- Every new portfolio item remains pending until Owner moderation.
- No order, payment, checkout, or transaction flow is introduced.
