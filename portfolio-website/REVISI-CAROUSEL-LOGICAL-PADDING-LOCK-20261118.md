# PIR Visuals — Carousel logical padding lock

Tanggal: 18 November 2026

## Perbaikan
- Padding horizontal pada kolom teks carousel desktop dikunci melalui properti CSS logical `padding-inline`, `padding-inline-start`, dan `padding-inline-end`, selain fallback fisik `padding-left` dan `padding-right`.
- Jarak kiri dan kanan konten teks sama-sama 35px.
- Jarak atas 46px dan bawah 42px.
- Aturan diarahkan ke elemen grid `.pv-showcase-slide > .pv-showcase-copy`.
- Versi cache stylesheet dinaikkan ke `20261118ag-equal-inline-35`.
- Aturan hanya berlaku pada desktop di atas 900px; mobile/tablet tidak diubah.
- Pembagian kolom, gambar, latar hijau, ukuran teks, dan urutan konten tidak diubah.

## Validasi
- 60/60 tes `tests/showcase*.test.js` lulus.
- `node --check server.js` lulus.
- `node --check pir-home-showcase.js` lulus.
