PIXEL REALM v20.7.0 — OWNER ACCESS CONTROL

ISI
- index.js: kode bot dengan pemeriksaan Owner berdasarkan allowlist OWNER_JIDS.
- pixel_realm_menu.png: gambar menu jika sudah tersedia pada paket/folder lama.

PENTING
1. Cadangkan index.js lama dan uji di folder terpisah.
2. Salin kode ini menjadi index.js.
3. Tambahkan OWNER_JIDS di file .env. Contoh:
   OWNER_JIDS=6281234567890
   Untuk beberapa Owner, pisahkan dengan koma:
   OWNER_JIDS=6281234567890,6289876543210
   Bisa juga menggunakan JID lengkap, misalnya 6281234567890@s.whatsapp.net.
   Jika akun WhatsApp Bot menampilkan ID @lid, gunakan JID @lid yang tepat jika nomor tidak cocok.
4. Jangan tulis tanda kutip atau spasi di tengah nomor. Jangan pernah bagikan file .env.
5. Restart bot setelah mengubah .env.
6. Dari akun Owner, uji .owner dan .backup. Dari admin grup biasa, uji .owner dan .backup; keduanya harus ditolak.

KEAMANAN
- Owner hanya diambil dari OWNER_JIDS pada .env. Status admin grup tidak dapat memberi akses Owner.
- Tidak tersedia command chat untuk menambahkan Owner. Perubahan daftar Owner dilakukan manual oleh pemilik server pada .env.
- .backup sekarang khusus Owner. Perintah moderasi (kick, mute, antilink, antispam, dan sejenisnya) tetap menggunakan admin grup.
- Jika OWNER_JIDS kosong atau salah, tidak ada akun yang dapat memakai command Owner/backup. Perbaiki .env secara lokal lalu restart.
- Owner check mencocokkan JID yang dinormalisasi. Nomor biasa diubah menjadi @s.whatsapp.net; untuk akun @lid, masukkan JID @lid yang cocok.

CATATAN
- File ini tidak mengubah database atau autentikasi WhatsApp.
- node --check hanya memeriksa sintaks, bukan menguji semua fitur pada WhatsApp/MongoDB nyata.
- Backup database memerlukan mongodump yang tersedia di PATH.
