# Laporan QA — PIR Visuals 20261115ag

Tanggal: 15 November 2026

## Perubahan

1. Ornamen hero pada halaman publik memakai closed CSS motion path, bukan translasi multi-keyframe lama yang terasa putus-putus. Animasi membuat lintasan penuh 9,6 detik, dengan orbit sekunder 11,7 detik.
2. Band hasil Shortlist memakai `padding-top` dan `padding-bottom` yang **identik** di setiap breakpoint, dengan ruang 27–66 px sesuai ukuran layar. Panel kosong tetap berada di tengah komposisi.
3. Tema forest–sage–ivory diberikan sebagai token bersama untuk halaman publik (Shortlist, Kategori, Jelajahi, Untuk Bisnis, Tentang, Cara Kerja, Contact, dan Collection), tanpa mengubah Designer Studio privat.

## Hasil pemeriksaan lokal

- `npm run check`: **lulus** (sintaks JavaScript).
- `node --test tests/shortlist-orbit-balance-20261115ag.test.js`: **5/5 lulus**.
- Chromium dengan seluruh CSS inline pada fixture halaman publik: **12 skenario** (Shortlist, Untuk Bisnis, Jelajahi x 390/768/1365/1920 px); horizontal overflow **0** pada semua skenario.
- Shortlist: `paddingTop` sama dengan `paddingBottom` pada semua ukuran; posisi toolbar terhadap batas atas dan panel kosong terhadap batas bawah berbeda maksimal sekitar 1px karena pembulatan rendering.
- Chrome computed CSS: motion path dipakai pada desktop; `offset-distance` berubah secara kontinu seiring waktu; pada `prefers-reduced-motion: reduce`, `animation-name: none`.
- CSS diparsing dengan `tinycss2`: tidak ada kesalahan token stylesheet tingkat atas.

## Batas pemeriksaan

Fixture mensimulasikan HTML halaman publik dengan stylesheet proyek lengkap. Halaman sebenarnya pada mesin pengguna, server staging/produksi, proses login, data MongoDB dan integrasi backend **belum diverifikasi** dalam pemeriksaan ini. Satu tes lama `universal-navigation-v5.81.test.js` membutuhkan `package.json` pada root monorepo yang tidak disertakan di paket website terpisah; kegagalan fixture tersebut bukan hasil uji fungsi UI.
