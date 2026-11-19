# PIR Visuals v5.30.0 — Full Features Upgrade

## Fitur yang ditambahkan
1. Drag-and-drop uploader dengan preview thumbnail, maksimal 5 gambar per karya, maksimal 8 MB per gambar.
2. Crop preset original, square 1:1, landscape 16:9, portrait 3:4; Sharp melakukan crop di server.
3. Gallery paths per portfolio item dan endpoint media `/media/ART-ID/1..4`.
4. Owner moderation dashboard `/dashboard`: antrean pending, preview media, approve/reject, catatan penolakan.
5. Analytics 14 hari di Owner dashboard, metrik views/contacts; ringkasan analytics pada Designer Studio.
6. Email verification menggunakan SMTP; token verifikasi acak disimpan hash dan kedaluwarsa 30 menit.
7. Login memerlukan email verified + password scrypt + OTP WhatsApp sekali pakai.
8. Session disimpan di MongoDB collection `designerdashboardsessions`, token hash dan TTL 8 jam.
9. Portfolio collections: desainer mengelompokkan approved works; dapat publish/unpublish.
10. Client testimonials: desainer menambahkan testimonial dan memilih publish/unpublish.
11. Existing Baileys commands, bot moderation and separate Game Center retained.

## Setup tambahan
- Website package adds `nodemailer`; run `npm install` inside `portfolio-website`.
- Configure SMTP variables in `.env` using `.env.example`.
- Ensure website and bot use the same MongoDB database and the website has write access to collections and portfolio upload directory.
- `PORTFOLIO_UPLOAD_DIR` must resolve to the same physical folder used by the bot; set `BOT_DATA_ROOT` accordingly.
- HTTPS is required in production so session cookie gets Secure attribute when `NODE_ENV=production`.

## Security and behavior
- Email verification token is one-time, stored as SHA-256 hash and expires in 30 minutes.
- Session token is random, only hash stored in MongoDB, expires after 8 hours with TTL cleanup.
- Upload format validated by Sharp, 20 megapixel input limit, 8 MB per image, max 5 images.
- Work upload/edit remains pending until Owner moderation; public media endpoint serves approved works only.
- Collection item IDs are checked against approved works owned by current designer.
- Testimonial default is unpublished; public profile displays only published testimonials.
- Owner moderation endpoints require HTTP Basic Auth and origin check.

## Validation status
- `node scripts/check-js.js`: 170 JavaScript files lulus.
- Website tests: 16/16 lulus.
- Existing Designer Studio regression tests: 4/4 lulus.
- Root suite: 321/328 lulus; 7 existing failures remain in command catalog/routing, designer growth, game registry and general help tests.
- Live SMTP delivery, MongoDB integration, and WhatsApp OTP were not exercised in this isolated build environment.
