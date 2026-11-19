# Revisi carousel — right inset adjustment D (18 November 2026)

- Padding kiri desktop tetap `clamp(76px, 6.8vw, 104px)` agar judul, kategori, deskripsi, dan CTA tidak bergeser.
- Padding kanan desktop diturunkan dari `clamp(56px, 5vw, 76px)` menjadi `clamp(16px, 1.8vw, 24px)`. Pada viewport desktop 1366px, ruang kanan menjadi sekitar 24px sehingga harga dan tautan Profil kreator bergerak sekitar 44px lebih ke kanan dibanding revisi sebelumnya.
- Perubahan diterapkan pada runtime inline, fallback inline di server, dan fallback stylesheet agar tidak saling menimpa.
- Kolom gambar, grid, sumber media, rasio, object-fit, dan layout mobile tidak diubah.
- Runtime marker dan cache key stylesheet/script diperbarui ke `20261118-copy-inset-runtime-d`.
