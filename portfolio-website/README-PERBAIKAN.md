# PIR Visuals Website v3.52.0 — SVG & Designer Studio

## Perbaikan
- Preview SVG dinormalisasi dengan MIME `image/svg+xml`, sehingga file SVG dari Windows/Figma dapat tampil meski MIME perangkat kosong.
- SVG dikonversi di browser menjadi WebP (fallback PNG) sebelum dikirim ke server.
- Rasterisasi SVG di server memakai 72 DPI agar ekspor Figma 3636 × 2045 tidak melewati batas 20 MP.
- Upload karya tetap maksimal 15 MB per file dan lima file per karya.
- Foto profil dapat diunggah langsung dari perangkat: JPG/PNG/WebP, maksimal 5 MB. Tidak perlu URL.
- Ikon Workspace sesuai fungsi, menu mengarah ke bagian yang benar dan memiliki scroll aktif.
- Kolom profil, portfolio, case study, layanan, koleksi, testimoni dan ketersediaan dilengkapi contoh.

## Pemasangan
1. Backup website dan database.
2. Ekstrak folder `portfolio-website` dari ZIP rilis ke root proyek PIR Visuals.
3. Pertahankan `.env`, `uploads/portfolio`, database, dan folder runtime.
4. Jalankan `npm ci` di folder `portfolio-website` agar dependensi native Sharp sesuai Windows.
5. Jalankan `npm run check`, lalu restart website.
6. Muat ulang browser dengan `Ctrl + Shift + R`.

Untuk upload SVG dari bot WhatsApp, pasang juga bot v6.7.5. Bot dan website harus memakai `MONGO_URI`, `BOT_DATA_ROOT`, serta `PORTFOLIO_UPLOAD_DIR` yang sama.
