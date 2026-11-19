# Patch Fitur Designer dan Sistem Langganan

Patch kumulatif ini mempertahankan fitur unduhan, status antrean, pembatalan antrean, dan atribusi pengguna dari patch sebelumnya. Patch menambahkan alat bantu desainer dan akses pelanggan.

## Perintah baru

### Anggota
- `.akses` — melihat peran dan status langganan.
- `.colorpalette [gaya]` — palet warna siap pakai: minimalis, futuristik, elegan, alam, retro, pastel.
- `.contrast <HEX teks> <HEX latar>` — hitung rasio kontras dan cek ambang WCAG AA/AAA.
- `.checklist poster|sosial|logo` — checklist sebelum publikasi.
- `.revision` — template brief revisi.

### Pelanggan aktif
- `.brandkit <nama brand>` — template brand kit.
- `.pricing <jam> <tarif per jam> [biaya tambahan]` — estimasi dasar harga desain.

### Owner bot
- `.sub grant <nomor WhatsApp> <hari>` — berikan atau perpanjang langganan.
- `.sub revoke <nomor WhatsApp>` — cabut langganan.
- `.sub list` — daftar langganan.
- `.sub status` — ringkasan jumlah langganan aktif/kedaluwarsa.

Owner bot ditentukan lewat `OWNER_JIDS` di `.env`. Nomor target langganan ditulis sebagai angka dengan kode negara, tanpa tanda plus, misalnya `628123456789`. Durasi minimal 1 hari dan maksimal 3650 hari. Pemberian langganan berulang menambahkan hari ke tanggal kedaluwarsa yang masih aktif.

## Penyimpanan

Data langganan disimpan ke `data/bot-subscriptions.json` dan file tersebut masuk `.gitignore`. Backup file itu secara aman jika perlu memindahkan data pelanggan. Jangan membagikan file ini ke publik.

## Penerapan

1. Matikan bot.
2. Ekstrak ZIP ini ke folder proyek yang sama dan izinkan file patch menimpa file lama.
3. Pastikan `.env`, `auth_info/`, database, dan data lokal lama tetap dipertahankan; jangan menggantinya dengan file dari ZIP patch.
4. Jalankan `npm test` lalu `npm run check`.
5. Nyalakan bot dan uji `.akses`, `.colorpalette futuristik`, `.checklist logo`, lalu uji langganan dari akun Owner.

Patch tidak memproses pembayaran otomatis. Owner memberikan atau mencabut akses secara manual setelah memverifikasi pembayaran di luar bot. Fitur harga adalah kalkulasi dasar, bukan rekomendasi harga pasar. Uji langsung di WhatsApp tetap diperlukan sebelum dipakai oleh anggota.
