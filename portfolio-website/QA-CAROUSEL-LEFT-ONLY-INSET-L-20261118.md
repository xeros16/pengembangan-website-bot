# QA Carousel — Left-Only Inset L

## Cakupan
- Memastikan hanya padding kiri desktop yang berubah.
- Memastikan padding kanan tetap `clamp(16px, 1.8vw, 24px)`.
- Memastikan override padding desktop dilepas pada mobile.
- Memastikan kolom gambar, rasio media, dan grid tidak menjadi target patch.

## Hasil
- `npm run check`: lulus.
- Tes regresi terpilih: 19/19 lulus.
- Tes memeriksa runtime JavaScript, fallback CSS/server, cache key, alignment harga/profil, dan perilaku mobile.
- Tidak ada perubahan pada sumber gambar, ukuran kolom gambar, rasio media, atau object-fit.
