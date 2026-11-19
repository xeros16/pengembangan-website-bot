# Patch: Diagnostik Downloader dan Pesan Error

## Yang ditambahkan

- Perintah `.dl health` dan `.download health` untuk memeriksa apakah Python + `yt-dlp` serta FFmpeg dapat dijalankan.
- Menampilkan versi `yt-dlp` dan FFmpeg bila tersedia.
- Batas waktu pemeriksaan komponen 10 detik per pemeriksaan.
- Klasifikasi error downloader agar pengguna mendapat arahan yang lebih jelas untuk kasus timeout, Python tidak ditemukan, modul `yt-dlp` belum terpasang, FFmpeg tidak ditemukan, URL/format tidak didukung, media privat/tidak tersedia, pembatasan HTTP 429/403, masalah jaringan, dan file terlalu besar.
- Menggunakan satu helper untuk memilih executable Python dan menyiapkan environment agar pemeriksaan dan proses download konsisten.
- Menambah tes otomatis untuk klasifikasi error dan hasil perintah health.

## Perintah baru

```text
.dl health
.download health
.dl status
```

`health` hanya memeriksa executable dan versi lokal. Ia tidak menguji semua situs media dan tidak menjamin setiap URL akan berhasil.

## Pemasangan

Salin file dari patch ke proyek dengan struktur direktori yang sama. Cadangkan file yang akan diganti terlebih dahulu, lalu jalankan:

```bash
node --check features/commands/media-download.js
node --test tests/media-download.test.js tests/command-attribution.test.js
npm test
npm run check
```

Jangan mengganti atau mengunggah `.env`, folder sesi WhatsApp, kredensial, atau `node_modules` menggunakan patch ini.
