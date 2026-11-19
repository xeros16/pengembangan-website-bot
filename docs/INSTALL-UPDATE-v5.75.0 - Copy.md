# Update PIR Visuals v5.75.0

Paket ini adalah **update/overlay website**, bukan pengganti seluruh project. Ekstrak kedua ZIP ke folder project PIR Visuals yang sama. Jika diminta, izinkan file update menimpa file source yang namanya sama.

## Cara memasang

1. Backup folder project saat ini.
2. Download `Part1.zip` dan `Part2.zip`.
3. Ekstrak `Part1.zip` ke root project yang berisi `package.json`.
4. Ekstrak `Part2.zip` ke **folder root yang sama**. Jangan membuat folder project baru untuk bagian kedua.
5. Pertahankan file `.env`, sesi WhatsApp/Baileys, folder `uploads`, data MongoDB, dan konfigurasi lokal. Paket update ini tidak menyertakan atau mengganti data tersebut.
6. Jalankan `npm install` dari root project bila package manager meminta sinkronisasi lockfile. Dependency aplikasi tidak berubah pada update ini.
7. Jalankan `npm --prefix portfolio-website install` jika dependency website belum terpasang atau perlu disinkronkan.
8. Restart website dengan `npm run website`, lalu lakukan hard refresh browser (`Ctrl + Shift + R`).

## Yang diperbarui

- `portfolio-website/server.js` dan seluruh tes website.
- Metadata versi root dan website, lockfile, README, changelog, serta release notes.
- Navigasi aktif, kartu desainer, dan sistem ritme visual halaman discovery.

Tidak ada perubahan pada command bot, sesi WhatsApp, struktur koleksi MongoDB, atau skema database.
