# Panel Owner dan Pengelolaan Pintasan

Semua perintah pada panduan ini hanya dapat dijalankan oleh akun yang tercantum di `OWNER_JIDS` pada `.env`. Admin grup tidak otomatis menjadi Owner bot.

## Panel Owner

- `.owner` — status singkat database dan proses bot serta daftar pengelolaan.
- `.alias` — melihat pintasan khusus yang tersimpan.
- `.alias add <nama> <perintah>` — membuat pintasan baru.
- `.alias remove <nama>` — menghapus pintasan khusus.
- `.textlist`, `.textshow`, `.textedit`, `.textsave` — mengelola teks bot.

Contoh:

```text
.alias add kontras contrast
.alias add palet colorpalette
.alias remove palet
```

Pintasan langsung aktif setelah berhasil disimpan. Target harus merupakan perintah yang tercantum dalam katalog `.commands`. Nama pintasan dibatasi 1–12 karakter, diawali huruf, dan tidak boleh mengambil nama perintah atau pintasan bawaan.

Konfigurasi aktif disimpan pada `config/command-aliases.json`. Rilis menyediakan `config/command-aliases.example.json` sebagai template awal. Untuk perubahan manual melalui file, restart bot agar konfigurasi dimuat ulang. Jangan mengubah file konfigurasi saat bot sedang menulisnya.

## Keamanan

Jangan menambahkan akun ke `OWNER_JIDS` melalui perintah chat. Ubah `.env` secara langsung dan jaga file tersebut tetap rahasia. Jangan membagikan QR login, direktori sesi WhatsApp, atau kredensial database.


## Dashboard dan riwayat sistem (v3.19.0)

- `.stats` menampilkan jumlah pengguna, grup, aset, laporan terbuka, tiket terbuka, peringatan, catatan moderasi, dan lima pengguna paling aktif.
- `.activity` menampilkan lima catatan moderasi terbaru.
- `.activity 10` menampilkan hingga sepuluh catatan moderasi terbaru (batas maksimum 10).
- Kedua perintah hanya dapat digunakan Owner bot dan memerlukan database yang siap.
- Data dibaca dari koleksi yang sudah ada; fitur ini tidak menghapus atau mengubah data pengguna.


## Pusat operasi (v3.20.0)

- `.health` — status proses, state koneksi database, reconnect, uptime, memori, dan antrean. Ini bukan tes ping database atau tes pengiriman WhatsApp.
- `.groups [jumlah]` — konfigurasi grup yang tercatat di database, termasuk anti-link dan anti-spam. Ini bukan daftar seluruh grup yang diikuti bot.
- `.reports [jumlah]` — laporan berstatus terbuka.
- `.tickets [jumlah]` — tiket berstatus terbuka.

Jumlah opsional dibatasi 1–15; nilai bawaan 10. Semua perintah hanya membaca data dan khusus Owner.

## Pengaturan runtime (v3.21.0)

Owner dapat mengelola mode pemeliharaan melalui WhatsApp:

```text
.botconfig
.botconfig maintenance on
.botconfig maintenance off
.botconfig notice Bot sedang diperbarui. Coba lagi beberapa saat.
.botconfig notice reset
```

Mode pemeliharaan membatasi command anggota di command router. `.help`, `.menu`, `.mulai`, `.akses`, dan daftar perintah tetap tersedia. Owner tetap dapat menggunakan command Owner. Moderasi grup diproses pada tahap terpisah sebelum command router sehingga pengaturan ini tidak mematikan moderasi grup. File aktif `config/bot-settings.json` dibuat otomatis ketika Owner mengubah pengaturan; template awal tersedia sebagai `config/bot-settings.example.json`.


## Kebijakan Owner dan allowlist (v5.19.0 kandidat)

- Bypass Owner hanya berlaku pada chat pribadi dengan JID nomor WhatsApp atau LID yang valid.
- Pesan Owner di grup tetap memerlukan allowlist grup.
- Untuk mengizinkan grup baru tanpa membuka akses dari grup yang belum disetujui, jalankan `.allowlist group add <JID-grup>` dari chat pribadi Owner.
- JID pribadi Owner yang telah diverifikasi didaftarkan otomatis untuk menerima balasan bot.
