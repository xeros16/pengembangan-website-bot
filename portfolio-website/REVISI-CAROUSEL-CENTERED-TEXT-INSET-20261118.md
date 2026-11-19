# Revisi Carousel — Inset Teks Desktop Diperbesar

Tanggal: 18 November 2026

## Perbaikan
- Penyebab posisi teks masih terlalu ke kiri: revisi sebelumnya mempersempit wrapper dalam, tetapi tidak mengunci padding langsung pada kolom teks yang sebenarnya.
- Sekarang padding horizontal diterapkan langsung pada `.pv-showcase-copy`, dengan nilai sama di kiri dan kanan: `clamp(58px, 5.2vw, 82px)`.
- Wrapper isi memakai lebar 100% dari area konten yang sudah dipadding; tidak ada lagi pengaturan lebar 70px yang ambigu.
- Padding vertikal desktop tetap 46px atas dan 42px bawah.
- Layout mobile/tablet, rasio dan ukuran gambar, urutan kolom, serta konten tidak diubah.

## Cache
- Cache stylesheet diperbarui menjadi `20261118-copy-centered-70`.
