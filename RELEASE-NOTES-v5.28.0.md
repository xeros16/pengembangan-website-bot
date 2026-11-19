# PIR Visuals v5.28.0 — Designer Studio

## Fitur
- Designer Studio web di `/studio`, terpisah dari WhatsApp Baileys dan Game Center.
- Aktivasi akun memakai `.portfolio dashboard setup`: bot mengeluarkan token acak sekali pakai, disimpan sebagai hash dan kedaluwarsa 20 menit.
- Aktivasi mengaitkan email login dan password minimal 12 karakter ke profil desainer yang cocok dengan `ownerJid`.
- Password di-hash dengan scrypt; email menjadi identitas login tetapi belum diverifikasi lewat email.
- Login memakai email + password + OTP enam digit yang diminta melalui `.portfolio dashboard otp`; OTP sekali pakai dan berlaku lima menit.
- Session cookie HttpOnly, SameSite=Strict, Secure saat NODE_ENV=production, masa berlaku 8 jam; session in-memory akan berakhir saat website restart.
- Pembatasan percobaan login, pembatasan percobaan OTP, pemeriksaan CSRF untuk perubahan profil/layanan.
- Desainer dapat mengedit profil, skill, software, pengalaman, lokasi, kontak publik, sosial, harga, status menerima proyek, visibilitas profil.
- Desainer dapat menambah layanan dan mengaktifkan/menonaktifkan layanan.
- Daftar karya dan status moderasi ditampilkan di dashboard; upload dan pengeditan karya belum tersedia melalui web.
- Dashboard Owner `/dashboard` tetap dipertahankan.

## Perintah WhatsApp baru
- `.portfolio dashboard setup`
- `.portfolio dashboard otp`
- `.portfolio dashboard`

## Batasan yang diketahui
- Belum ada verifikasi kepemilikan email melalui tautan/email OTP; verifikasi kepemilikan akun desainer dilakukan lewat token aktivasi yang dikirim ke WhatsApp pemilik profil.
- Session disimpan di memori proses website, bukan store persisten.
- OTP dikirim melalui percakapan WhatsApp bot; tidak menggunakan email/SMS.
- Upload/edit/hapus item portofolio belum tersedia dari web.
- Uji integrasi langsung membutuhkan MongoDB aktif, profil desainer, dan koneksi WhatsApp yang sah.

## Hasil validasi lokal
- Syntax check: 170 file JavaScript lulus.
- Website tests: 7/7 lulus.
- Tes regresi Designer Studio: 4/4 lulus.
- Root suite: 321/328 lulus; 7 gagal karena dependensi runtime `node-fetch` tidak tersedia pada environment offline. Root suite perlu diulang setelah `npm install` pada Windows/host deployment.
