# Revisi carousel — right inset nudge (18 November 2026)

- Mempertahankan inset kiri desktop pada `clamp(76px, 6.8vw, 104px)`.
- Mengurangi inset kanan desktop menjadi `clamp(56px, 5vw, 76px)` agar harga di kanan atas dan tautan profil kreator di kanan bawah bergeser sedikit ke kanan.
- Judul, kategori, deskripsi, dan CTA yang rata kiri tidak digeser karena padding kiri tidak berubah.
- Kolom gambar, ukuran panel, sumber media, rasio, dan object-fit tidak diubah.
- Mobile tetap memakai aturan mobile yang sudah ada; inline desktop padding dilepas di bawah 901px.
- Cache key runtime dan stylesheet dinaikkan ke `20261118-copy-inset-runtime-c`.
