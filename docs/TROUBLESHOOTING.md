# Pemecahan masalah

## Bot tidak bisa memulai

- Jalankan `npm run doctor` dan perbaiki peringatan konfigurasi.
- Jalankan `npm install` jika dependensi belum ada.
- Periksa log terminal; jangan mengirim log yang memuat token, nomor pribadi, atau kredensial database.

## Bot menolak perintah Owner

- Pastikan `OWNER_JIDS` berisi JID akun Owner yang benar di `.env`.
- Simpan file, lalu restart bot. Perubahan `.env` tidak otomatis dimuat ulang.
- Status admin grup tidak menggantikan identitas Owner bot.

## Bot tidak terhubung ke MongoDB

- Pastikan MongoDB berjalan dan `MONGO_URI` menunjuk ke instance yang benar.
- Jangan mengirim URI database jika mengandung username atau password.

## Fitur unduh media tidak bekerja

- Jalankan `yt-dlp --version` dan `ffmpeg -version` di terminal.
- Pastikan situs sumber didukung oleh yt-dlp dan tautan dapat diakses.
- Fitur unduh media bersifat opsional; fitur lain dapat digunakan tanpa kedua program tersebut.

## Sesi WhatsApp bermasalah

- Hentikan bot sebelum memindahkan folder sesi.
- Gunakan hanya folder yang ditunjuk `AUTH_DIR` di `.env`.
- Jangan mencampur isi dua folder autentikasi berbeda.
- Jika sesi telah dibagikan, hapus perangkat tertaut yang tidak dipercaya dari WhatsApp dan tautkan ulang bot.

## Fitur premium tidak terbuka

- Ketik `.akses` untuk memeriksa status akun.
- Owner dapat memeriksa `.sub status` dan memberikan akses melalui `.sub grant <nomorWhatsApp> <hari>`.
- File `data/bot-subscriptions.json` adalah data lokal privat; simpan cadangannya dengan aman.
