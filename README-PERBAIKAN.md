# PIR Visuals Website v3.51.0 — SVG Upload

## Isi pembaruan
- Designer Studio menerima JPEG, PNG, WebP, dan SVG.
- Batas setiap file: 15 MB; maksimal lima file per karya.
- Total request upload website: maksimal 80 MB.
- SVG divalidasi lalu dirasterisasi menjadi WebP untuk pratinjau publik yang aman.
- Upload dari bot WhatsApp memakai pipeline, folder, dan collection portfolio yang sama.

## Pemasangan
1. Backup folder `portfolio-website` lama.
2. Ekstrak folder `portfolio-website` dari ZIP ini ke root proyek PIR Visuals.
3. Pertahankan `.env`, `uploads/portfolio`, database, dan folder runtime yang sudah ada.
4. Jalankan `npm ci` di dalam `portfolio-website` jika dependensi perlu dipasang ulang.
5. Jalankan `npm run check`, lalu restart proses website.
6. Hard refresh browser dengan `Ctrl + Shift + R`.

Untuk upload dari WhatsApp, pasang juga pembaruan bot v6.7.4. Bot dan website harus memakai `MONGO_URI`, `BOT_DATA_ROOT`, dan `PORTFOLIO_UPLOAD_DIR` yang sama.
