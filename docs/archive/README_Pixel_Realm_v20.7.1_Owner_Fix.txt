PIXEL REALM v20.7.1 — OWNER JID FIX

Tujuan:
- Tetap membaca OWNER_JIDS dari .env.
- Menambahkan pencocokan identitas alternatif Baileys jika tersedia (mis. participantAlt / @lid dan nomor WhatsApp).
- Menampilkan log startup yang hanya menyatakan apakah OWNER_JIDS terbaca dan jumlah entri; nilai owner tidak dicetak.

CARA PASANG:
1. Hentikan bot.
2. Cadangkan index.js lama.
3. Salin file index_pixel_realm_v20.7.1_owner_jid_fix.js ke folder bot, lalu ubah namanya menjadi index.js.
4. Pastikan .env berada di folder kerja yang sama saat menjalankan `npm start` dan memiliki baris seperti:
   OWNER_JIDS=6281234567890
   (gunakan nomor akun Owner, kode negara, tanpa +; jangan ada spasi di tengah nomor).
5. Simpan .env, lalu restart proses Node.js sepenuhnya. Jangan hanya mengirim command restart ke bot jika proses lama masih hidup.
6. Saat startup, periksa console. Harus terlihat `[OWNER] OWNER_JIDS terbaca: 1 entri (nilai disembunyikan).`
7. Uji `.owner` dari akun yang terdaftar. Uji juga dari admin grup non-owner untuk memastikan ditolak.

PENTING:
- Jangan bagikan .env, token, sesi WhatsApp, atau isi autentikasi.
- Jika log menunjukkan OWNER_JIDS kosong, bot dijalankan dari folder berbeda, .env tidak ada di working directory, atau nama variabel salah.
- Jika log menyatakan terbaca tetapi Owner tetap ditolak, identitas pengirim mungkin tidak menyertakan alias alternatif di versi Baileys yang digunakan. Periksa baris log masuk dan identitas pengirim secara lokal; jangan kirim file .env. Kamu boleh mengirim hanya bentuk JID yang sudah disamarkan, mis. `62812***@s.whatsapp.net` atau `12***@lid`.
- node --check memeriksa sintaks saja; pengujian WhatsApp nyata masih diperlukan.
- Tidak mengubah database, .env, folder auth, atau data pemain.
