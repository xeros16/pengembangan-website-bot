# Revisi Carousel — Left-Only Inset L (18 November 2026)

## Basis
Menggunakan arsip `PIR-Visuals-Carousel-Equal-Left-Right-Inset-J-2026-11-18.zip` yang diberikan pengguna sebagai basis revisi.

## Perubahan
- Hanya inset kiri pada kolom teks carousel desktop (viewport minimal 901px) yang diperbesar.
- Padding kiri berubah menjadi `clamp(108px, 8.8vw, 132px)`, sehingga pada viewport desktop sekitar 1366px teks bergeser sekitar 27px ke kanan dibanding runtime sebelumnya.
- Padding kanan tetap `clamp(16px, 1.8vw, 24px)`; posisi tepi kanan harga, tautan profil kreator, dan garis pemisah tidak digeser.
- Kolom gambar kanan, lebar grid, rasio media, object-fit, warna, tipografi, dan urutan konten tidak diubah.
- Aturan mobile/tablet tidak diubah; override desktop dilepas saat viewport berada di bawah 901px.
- Runtime marker dan cache key stylesheet/script diperbarui ke `20261118-left-only-inset-l`.

## File yang disentuh
- `pir-home-showcase.js`
- `pir-showcase-editorial.css`
- `server.js`
- Tes regresi carousel terkait inset
- Metadata versi dan catatan rilis
