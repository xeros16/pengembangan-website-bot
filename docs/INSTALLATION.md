# Panduan instalasi

## Persiapan

- Gunakan Node.js 20 LTS atau lebih baru.
- Pasang MongoDB dan pastikan servicenya berjalan.
- Pasang `yt-dlp` dan FFmpeg jika ingin menggunakan fitur unduh media.

## Instalasi baru

1. Ekstrak rilis ke folder proyek baru.
2. Jalankan `npm install`.
3. Salin `.env.example` menjadi `.env`.
4. Isi `OWNER_JIDS` dengan JID Owner bot dan sesuaikan `MONGO_URI` jika MongoDB tidak memakai alamat default.
5. Jalankan `npm run doctor`, kemudian `npm run check` dan `npm test`.
6. Jalankan `npm start`, lalu pindai QR WhatsApp yang muncul.
7. Kirim `.menu` ke bot untuk memulai.

## Memperbarui instalasi lama

1. Hentikan bot lama.
2. Buat salinan aman dari `.env`, folder autentikasi yang ditentukan oleh `AUTH_DIR`, data langganan, database, dan unggahan portofolio.
3. Ekstrak rilis baru ke folder terpisah terlebih dahulu.
4. Salin konfigurasi dan data lokal yang diperlukan secara manual. Jangan menyalin `.git`, `node_modules`, file sementara, atau backup sesi yang tidak digunakan.
5. Jalankan pemeriksaan dan tes sebelum mengalihkan bot produksi.

Jangan pernah mengirim `.env`, folder autentikasi, atau database ke orang lain untuk meminta bantuan.
