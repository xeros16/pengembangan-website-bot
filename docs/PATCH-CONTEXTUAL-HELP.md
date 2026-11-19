# Patch Bantuan Kontekstual & Saran Perintah

## Tujuan
Membantu anggota yang salah mengetik perintah menemukan perintah yang benar tanpa harus hafal katalog. Bot hanya memberi saran dan tidak pernah menjalankan perintah secara otomatis.

## Perubahan
- Saat perintah tidak dikenal, bot mencoba mencocokkan ejaan dan menampilkan hingga tiga saran yang mirip.
- Saat topik `.help` tidak dikenal, bot memberi saran berbentuk `.help <perintah>` jika ada kecocokan.
- Pesan tetap menyediakan jalan kembali ke `.menu` dan `.mulai`.
- Pencocokan hanya memproses nama perintah; tidak mengeksekusi saran dan tidak mengubah izin perintah.

## Contoh
- Salah ketik `.contrst` → bot dapat menyarankan `.contrast`.
- Salah ketik `.help colrpalette` → bot dapat menyarankan `.help colorpalette`.
- Perintah yang sangat tidak mirip tetap mendapat panduan kembali ke menu.

## Pemasangan
1. Matikan bot.
2. Ekstrak ZIP ke folder proyek yang sama dan timpa file patch.
3. Jangan menimpa `.env`, sesi autentikasi WhatsApp, database, atau data lokal.
4. Jalankan `npm test` dan `npm run check`.
5. Nyalakan bot dan uji `.contrst`, `.help colrpalette`, dan `.menu`.

## Catatan
Saran berdasarkan kemiripan ejaan, jadi belum tentu selalu benar. Fitur ini hanya untuk membantu navigasi; pemeriksaan izin dan validasi setiap perintah tetap dilakukan oleh handler masing-masing.
