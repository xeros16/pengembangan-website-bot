# PIR Visuals · Revisi AP · 15 November 2026

## Permintaan

Dekorasi bergaya loading harus dipasang pada ornamen PIR Visuals yang mengambang di hero Jelajahi, bukan di band Cari talenta.

## Perubahan

- Menghapus ilustrasi stiker, kapsul, dan dua sorotan radial tambahan dari band Cari talenta.
- Mengembalikan band ke gradasi sage yang bersih, dengan form tetap terlihat jelas.
- Ornamen PIR Visuals di kanan hero kini memiliki ornamen kecil berbentuk bintang, titik-titik, daun, dan pensil terinspirasi ilustrasi intro.
- Ornamen kecil bergerak orbital secara `linear` 25 detik terus-menerus, tanpa berhenti di titik balik. Logo tetap berada di tengah dan animasi lingkaran yang sudah ada tetap aktif.
- Mendukung `prefers-reduced-motion` dan mode motion off.
- Versi stylesheet menjadi `pir-public-polish.css?v=20261115ap` agar perubahan terbaca setelah hard refresh.

## Berkas diubah

- `server.js`
- `pir-public-polish.css`

## Pemeriksaan

- `node --check server.js` dan pengujian struktur berkas.
- Pengujian visual browser perlu dilakukan pada lingkungan yang dapat menjalankan Node.js beserta paket proyek dan browser.
