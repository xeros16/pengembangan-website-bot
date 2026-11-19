# Instalasi PIR Visuals v5.78.0

## Langkah pemasangan
1. Hentikan website yang sedang berjalan.
2. Backup folder project terlebih dahulu.
3. Download `Part 1` dan `Part 2`.
4. Ekstrak keduanya ke **folder root project yang sama**. Jangan pisahkan menjadi dua folder instalasi.
5. Pilih Merge/Combine folders dan izinkan replace file source.
6. Jangan menghapus `.env`, database, uploads/media, folder sesi WhatsApp, atau file data lokal.
7. Dari folder root project, install dependency website yang baru:
   ```bash
   npm run website:install
   ```
   Perintah ini memasang GSAP 3.15.1 di `portfolio-website/node_modules`.
8. Jalankan pemeriksaan:
   ```bash
   npm run website:check
   ```
9. Jalankan test website:
   ```bash
   cd portfolio-website
   npm test
   ```
10. Kembali ke root dan jalankan website:
   ```bash
   cd ..
   npm run website
   ```
11. Buka website dan lakukan hard refresh (`Ctrl + Shift + R`).

## Tentang GSAP
GSAP diambil dari dependency npm yang dipasang lokal dan di-serve oleh website sendiri. Tidak ada ketergantungan runtime ke CDN eksternal. Jika proses instalasi GSAP gagal atau paket tidak tersedia, website tetap memakai sistem animasi CSS/IntersectionObserver sebelumnya; route vendor akan memberi status 503 yang jelas.

## File yang tidak boleh diganti
Update ini tidak menyertakan `.env`, database, uploads, sesi WhatsApp, atau `node_modules`. Data lokal tetap dipertahankan.

## Jika tampilan lama masih tersimpan
Service worker cache dinaikkan ke `pir-visuals-public-v24` dan asset memakai `v=5780`. Tutup tab website, buka kembali, lalu hard refresh. Jika masih tertahan, clear site data untuk localhost/domain website tersebut, lalu login ulang.

## Rollback
1. Hentikan website.
2. Kembalikan backup project sebelum update.
3. Jangan menghapus database, `.env`, uploads, atau sesi WhatsApp.
