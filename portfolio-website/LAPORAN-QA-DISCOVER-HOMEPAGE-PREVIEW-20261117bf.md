# QA — Discover, Homepage Media, dan Avatar Preview (2026-11-17)

## Pemeriksaan statis
- `node --check server.js`: lulus.
- `npm run check`: lulus.
- Test `homepage-media-upload.test.js`: lulus, termasuk pemeriksaan slot media Beranda terpisah.
- Test `designer-studio-usability.test.js`: lulus, termasuk pratinjau foto profil berbasis FileReader/data URL.
- Test tambahan: rasio natural gambar Jelajahi, avatar bulat, dan visibilitas media Beranda tanpa animasi.

## Batas verifikasi
Browser lokal pengguna, MongoDB, dan upload media nyata tidak tersedia di lingkungan build. Setelah pemasangan, lakukan pemeriksaan manual pada `/studio` (preview PNG sebelum simpan), `/discover` (avatar bulat dan gambar utuh), serta `/` (unggah media khusus Beranda dari Dashboard Owner).
- `website-security.test.js`: 165/173 lulus; 8 kegagalan yang sama juga muncul pada paket v6.7.8 baseline (bukan regresi versi ini).
