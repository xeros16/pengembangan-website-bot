# Instalasi Update PIR Visuals v5.76.0

Paket ini adalah **overlay update**, bukan full project. Unduh dan ekstrak kedua ZIP Part 1 dan Part 2 ke folder utama project PIR Visuals yang sudah ada.

## Langkah pemasangan

1. Matikan proses website terlebih dahulu.
2. Buat backup folder project atau minimal file yang akan ditimpa.
3. Ekstrak `PIR_Visuals_v5_76_0_Light_Mode_Update_Part1.zip` ke folder utama project.
4. Ekstrak `PIR_Visuals_v5_76_0_Light_Mode_Update_Part2.zip` ke folder utama project yang sama.
5. Jika diminta, izinkan merge folder dan replace file source.
6. Jangan hapus atau mengganti `.env`, sesi WhatsApp, `uploads`, database, atau data lokal.
7. Jalankan pemeriksaan:
   - `npm run website:check`
   - `npm run website:test`
8. Restart website dengan `npm run website`.
9. Hard refresh browser (`Ctrl + Shift + R`) agar CSS dan JavaScript cache baru dimuat.

## Isi update

- `portfolio-website/server.js`
- package manifests dan lockfile version metadata
- regression test Light Mode v5.76.0
- release notes, changelog, dan test report

## Catatan

Tidak perlu menjalankan ulang instalasi dependency karena dependency graph tidak berubah. Jangan menggabungkan ZIP menjadi satu arsip; cukup ekstrak keduanya ke direktori project yang sama.
