# Revisi Carousel M — Geser Teks Kiri ke Kiri

Basis revisi: `PIR-Visuals-Carousel-Equal-Left-Right-Inset-J-2026-11-18.zip`.

Perubahan:
- Hanya padding kiri kolom copy carousel desktop yang dikurangi menjadi `clamp(44px, 3.8vw, 56px)`.
- Padding kanan dipertahankan persis `clamp(16px, 1.8vw, 24px)` pada runtime.
- Kolom gambar kanan, lebar kolom, rasio media, ukuran gambar, struktur slide, dan layout mobile tidak diubah.
- Runtime JavaScript dan fallback CSS diselaraskan agar tidak saling menimpa.
- Cache-busting asset diperbarui ke `20261118-left-shift-m`.

Pemasangan: ganti folder `portfolio-website` dari arsip ini, restart server, lalu lakukan hard refresh (`Ctrl + Shift + R`).
