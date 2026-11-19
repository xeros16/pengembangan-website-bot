# PIR Visuals — Pembaruan shortlist & floating ornament (20261115ag)

## Yang diperbaiki

- Ornamen pada hero halaman publik kini bergerak memakai **CSS motion path** tertutup, bukan rangkaian keyframe translasi yang menghasilkan gerakan bersudut dan berhenti sejenak di titik-titiknya. Satu putaran 9,6 detik dan orbit sekunder 11,7 detik; animasi linier sepanjang lintasan lengkung. Animasi pada layar kecil dan saat pengguna memilih *reduced motion* mengikuti preferensi perangkat.
- **Shortlist:** padding atas dan bawah band hasil disamakan secara eksplisit menjadi `clamp(42px, 4.4vw, 66px)` (layar ≤760px: `clamp(27px, 7vw, 40px)`). Ruang di sekeliling tombol, judul, dan *empty state* lebih seimbang. Jarak dari band ke footer tetap tanpa spacer kosong.
- **Halaman publik lain:** penyesuaian token palet hutan–sage–ivory pada Jelajahi, Kategori, Tentang/Untuk Bisnis/Cara Kerja, Contact & Support, dan area Collection yang sudah menggunakan komposisi editorial. Pengaturan ini tidak menyentuh layar Designer Studio privat.

## Pemasangan

Ekstrak Part 1 dan Part 2 ke direktori induk yang sama hingga keduanya bergabung dalam folder `portfolio-website`. Cadangkan proyek dan `.env` yang sudah dipakai sebelum menggantinya. Instal dependensi bila diperlukan (`npm ci`), lalu jalankan `npm start`. Lakukan hard refresh (**Ctrl + Shift + R**). Pastikan `pir-public-polish.css?v=20261115ag` termuat.

## Cakupan verifikasi

- `npm run check` memeriksa sintaks source JavaScript.
- Tes regresi `tests/shortlist-orbit-balance-20261115ag.test.js` memastikan aturan animasi dan ukuran band terdefinisi dengan benar.
- Pemeriksaan Chromium yang memuat **seluruh stylesheet** pada fixture halaman publik mengukur Shortlist di 390, 768, 1365, dan 1920px: lebar band mengikuti viewport, padding atas-bawah sama, jarak nyata toolbar ke tepi atas dan kartu ke tepi bawah selisih maksimal 1px, tidak ada horizontal overflow. Fixture Untuk Bisnis dan Jelajahi juga diperiksa pada ukuran yang sama.
- Yang belum diuji: database, pembayaran, login, server produksi, dan perilaku jaringan situs pada perangkat pengguna.
