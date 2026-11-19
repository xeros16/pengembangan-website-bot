# QA — Carousel Copy Equal Spacing (18 November 2026)

## Perubahan
- Padding kolom teks carousel desktop disamakan pada keempat sisi menggunakan `clamp(28px, 4vw, 56px)`.
- Teks tetap rata kiri; yang diseimbangkan adalah ruang di dalam kolom kiri.
- Pembagian kolom 50:50, gambar, latar hijau, ukuran tipografi, dan susunan konten tidak diubah.
- Aturan hanya berlaku pada desktop (`min-width: 901px`); tablet dan mobile tetap menggunakan aturan sebelumnya.
- Cache stylesheet diperbarui ke `20261118ab`.

## Validasi
- 49 pengujian regresi khusus carousel/showcase: lulus.
- `npm run check`: lulus.
- `npm test`: 534 lulus, 73 gagal pada pemeriksaan proyek lain yang tidak terkait perubahan carousel; beberapa tes lama masih mengharapkan versi stylesheet lain.
