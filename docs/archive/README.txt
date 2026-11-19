PIXEL REALM v20.5.0 — MENU ART + TRANSACTION AUDIT NOTES

ISI PAKET
- index.js: kode utama (berasal dari v20.4.0).
- pixel_realm_menu.png: ilustrasi Pixel Quest yang dipakai untuk .game menu.

PEMASANGAN
1. Hentikan bot. Cadangkan index.js lama dan jangan hapus database/auth_info/.env.
2. Ekstrak ZIP ke folder uji terlebih dahulu.
3. Salin index.js dan pixel_realm_menu.png ke folder bot yang sama.
4. Jika gambar diletakkan di lokasi lain, atur GAME_MENU_IMAGE=path/ke/gambar.png di .env. Path relatif dihitung dari working directory bot.
5. Jalankan npm start dan uji .game menu, .game help, dan .game visual.
6. Bila gambar tidak dapat dibaca/dikirim, bot fallback ke teks dan mencatat error.

AUDIT TRANSAKSI — BATASAN PENTING
- Penyimpanan game per pemain memakai satu update dokumen MongoDB; ini bukan transaksi lintas dokumen.
- PvP memperbarui dua dokumen pemain. Marketplace dapat mengubah listing serta dua akun. Hadiah World Boss dapat mengubah klaim boss dan data pemain. Kegagalan di tengah proses masih bisa membuat data tidak sinkron.
- Transaksi MongoDB lintas dokumen memerlukan replica set atau sharded cluster. MongoDB standalone tidak mendukungnya. Jangan menganggap masalah ini selesai hanya karena pemeriksaan sintaks lolos.
- Sebelum mengaktifkan transaksi, backup database, uji di salinan, konfigurasi replica set, dan uji kegagalan proses secara eksplisit. Jangan lakukan reset database.

PENGUJIAN MINIMUM
[ ] .game menu mengirim gambar dengan caption menu
[ ] Gambar hilang -> bot memberi fallback teks
[ ] Progres level/gold/inventory tetap ada setelah restart
[ ] PvP dua akun dan spam command diuji di database uji
[ ] Pembelian marketplace dan klaim World Boss diuji untuk kegagalan di tengah proses
[ ] Verifikasi data pemain sebelum pindah ke produksi

Pemeriksaan node --check berhasil pada file JavaScript saat paket dibuat. Integrasi WhatsApp/MongoDB belum diuji langsung.
