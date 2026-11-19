# Instalasi Update PIR Visuals v5.77.0

## Cara memasang
1. Hentikan website yang sedang berjalan.
2. Buat backup folder project terlebih dahulu.
3. Download `Part 1` dan `Part 2`.
4. Ekstrak kedua ZIP ke **folder root project yang sama**. Jangan mengekstrak ke dua folder terpisah.
5. Saat diminta, pilih **Merge/Combine folders** dan izinkan replace file source.
6. Jangan menghapus atau mengganti `.env`, database, uploads/media, folder sesi WhatsApp, atau file data lokal.
7. Jalankan pemeriksaan website:
   ```bash
   npm run website:check
   cd portfolio-website
   npm test
   ```
8. Jalankan kembali website:
   ```bash
   cd ..
   npm run website
   ```
9. Buka website dan lakukan hard refresh (`Ctrl + Shift + R`).

## File yang diperbarui
Update ini hanya berisi file source, metadata release, regression tests, dan dokumentasi. Tidak membawa `.env`, database, uploads, auth/session WhatsApp, atau `node_modules`.

## Jika tampilan lama masih tersimpan
Service worker cache dinaikkan ke `pir-visuals-public-v23` dan asset URL menggunakan `v=5770`. Jika browser masih menampilkan CSS lama, tutup tab website, buka kembali, lalu lakukan hard refresh. Jika masih tertahan, clear site data untuk localhost/domain website tersebut, kemudian login ulang.

## Rollback
Jika ada masalah setelah pemasangan:
1. Hentikan website.
2. Kembalikan backup folder project sebelum update.
3. Jangan menghapus database atau folder upload.
