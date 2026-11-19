# Panduan Integrasi Akun WhatsApp dan Website PIR Visuals v5.39.0

## Satu database untuk dua kanal

Bot dan website tetap berjalan sebagai dua proses terpisah, tetapi keduanya harus memakai `MONGO_URI` yang sama dari file `.env` di folder utama proyek.

Website otomatis membaca `.env` utama. `BOT_DATA_ROOT` default ke folder utama proyek. `PORTFOLIO_UPLOAD_DIR` juga harus sama untuk bot dan website.

## Pendaftaran dari WhatsApp terlebih dahulu

1. Pengguna masuk grup komunitas desain yang diizinkan.
2. Kirim `.portfolio daftar` melalui bot dan selesaikan wizard profil.
3. Profil tersimpan ke collection `designerprofiles` dan langsung dapat ditemukan di website.
4. Untuk membuat kredensial login website, buka `/studio/register` dan isi nomor WhatsApp yang sama, email, password, serta profil dasar.
5. Salin kode satu kali yang muncul di website.
6. Kirim `.portfolio link KODE` kepada bot melalui chat pribadi dari nomor yang sama.
7. Bot mencocokkan nomor WhatsApp, menghubungkan akun website ke profil lama, dan membuat kredensial dashboard.
8. Kembali ke website `/studio`, pilih kirim ulang verifikasi email, lalu verifikasi email.
9. Kirim `.portfolio dashboard otp` ke bot melalui chat pribadi.
10. Login website dengan email, password, dan OTP.

Profil dari bot tidak dibuat ulang. Profil lama tetap menjadi sumber data yang sama; bot dan website membaca dokumen MongoDB yang sama.

## Pendaftaran dari website terlebih dahulu

1. Buka `/studio/register`.
2. Isi nama publik, nomor WhatsApp E.164 (contoh `+6281234567890`), email, bio, spesialisasi dan password.
3. Website menyimpan permintaan sementara selama 30 menit dan menampilkan kode satu kali.
4. Kirim `.portfolio link KODE` ke bot melalui chat pribadi dari nomor yang sama.
5. Bot memastikan nomor WhatsApp cocok dan memastikan pengguna anggota grup komunitas yang diizinkan.
6. Jika belum ada profil bot, bot membuat profil baru menggunakan data website. Jika profil sudah ada, bot menautkan kredensial ke profil tersebut tanpa menggandakan profil.
7. Lanjutkan verifikasi email dan OTP seperti alur sebelumnya.

## Login website

- Buka `/studio`.
- Email harus sudah diverifikasi.
- Password minimal 12 karakter.
- OTP diperoleh melalui `.portfolio dashboard otp` di chat pribadi.
- OTP berlaku 10 menit.

## Upload karya portfolio

Karya dapat diunggah melalui dua kanal yang memakai storage dan collection MongoDB yang sama.

**Melalui WhatsApp bot**
1. Buka chat pribadi dengan bot dan kirim `.portfolio add`.
2. Kirim satu file JPEG, PNG, WebP, atau SVG sebagai pesan berikutnya. Untuk SVG, kirim sebagai Dokumen.
3. Ukuran maksimal 15 MB per file.
4. Ikuti prompt bot untuk mengisi judul, kategori, dan deskripsi.
5. Karya masuk antrean moderasi Owner dan baru tampil setelah disetujui.

**Melalui Designer Studio website**
1. Login ke `/studio` dan buka bagian Portfolio.
2. Pilih hingga lima file JPEG, PNG, WebP, atau SVG (maksimal 15 MB per file).
3. Isi detail karya dan kirim untuk moderasi Owner.

SVG divalidasi untuk menolak script, event handler, DTD/entity, dan referensi eksternal, lalu dikonversi menjadi WebP aman untuk pratinjau publik. File hasil bot dan website disimpan di `PORTFOLIO_UPLOAD_DIR` dan dicatat pada collection `portfolioitems` yang sama.

## Menjalankan di Windows

1. Salin `.env.example` menjadi `.env` jika belum tersedia.
2. Isi `MONGO_URI`, `PORTFOLIO_PUBLIC_BASE_URL`, `PORTFOLIO_UPLOAD_DIR`, `DESIGN_COMMUNITY_GROUPS`, dan konfigurasi SMTP.
3. Pastikan bot dan website menggunakan database yang sama.
4. Jalankan `npm install` di folder utama.
5. Jalankan `npm run website:install` sekali untuk dependency website.
6. Jalankan bot dengan `npm start`.
7. Jalankan website di terminal terpisah dengan `npm run website` atau `START-WEBSITE.bat`.
8. Pastikan port website (default 3010) diarahkan ke domain/tunnel yang benar.

## Variabel lingkungan penting

- `MONGO_URI`: database bersama untuk bot dan website.
- `BOT_DATA_ROOT`: folder utama proyek; default otomatis.
- `PORTFOLIO_UPLOAD_DIR`: folder upload bersama; gunakan nilai yang sama.
- `PORTFOLIO_WEB_HOST`: default `0.0.0.0`.
- `PORTFOLIO_WEB_PORT`: default `3010`.
- `PORTFOLIO_PUBLIC_BASE_URL`: domain publik untuk link verifikasi.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`: email verifikasi dan reset password.

## Catatan keamanan

- Jangan mengirim kode tautan pendaftaran atau OTP ke grup.
- Kode pendaftaran hanya dapat dipakai satu kali dan kedaluwarsa dalam 30 menit.
- OTP hanya dikirim ke chat pribadi dan kedaluwarsa dalam 10 menit.
- Akun website belum bisa login sampai email diverifikasi.
- Jangan membagikan file `.env`, folder `auth_info_baileys`, atau kredensial MongoDB.


## Kontrak integrasi website ↔ bot pada v5.96.0

- Bot dan website harus memakai `MONGO_URI` yang sama dari `.env` utama. Website memuat `.env` utama lebih dahulu; file `portfolio-website/.env` tidak boleh menimpa nilai root yang sudah ada.
- Koleksi profil bersama: `designerprofiles`. Koleksi karya bersama: `portfolioitems`. Analytics: `designeranalytics`. Notifikasi website: `designernotifications`.
- Nomor kontak publik disimpan dengan dua nama kompatibel: `publicWhatsApp` (bot) dan `contactPhone` (website). Bot dan website sekarang menulis keduanya bersamaan.
- CTA kontak pada profil publik membaca salah satu field dan membuka WhatsApp desainer secara langsung.
- Website Designer Studio dan bot dapat membuat upload pada storage serta collection portfolio yang sama; moderasi, analytics, kalender, dan notifikasi tetap memakai database bersama.
- Bot dapat membaca notifikasi website melalui `.portfolio notifikasi` atau `.portfolio notifikasi semua` di chat pribadi. Notifikasi tidak dikirim otomatis ke grup.
- `.portfolio analytics` membaca agregat analytics yang sama dengan website.
- Schema bot untuk profil/karya menggunakan kompatibilitas field lintas aplikasi agar metadata case study yang dibuat website tidak hilang saat bot memperbarui dokumen.

## Pemeriksaan integrasi

```bash
npm run integration:doctor
npm run verify:database
npm run smoke:deployment
```

`integration:doctor` membandingkan host, port, dan nama database tanpa mencetak kredensial. `verify:database` memeriksa koleksi dan nama index yang sudah ada tanpa mengubah database. `smoke:deployment` membutuhkan bot dan website staging sedang berjalan.


## Perbaikan upload SVG dan foto profil

- SVG dari Figma pada website dipratinjau dengan MIME SVG yang eksplisit, lalu dikonversi di browser ke WebP/PNG sebelum dikirim.
- Rasterisasi SVG pada bot memakai 72 DPI agar desain Figma berukuran besar tetap berada di bawah batas 20 MP sebelum optimasi.
- Foto profil desainer dapat diunggah langsung dari Designer Studio (JPG/PNG/WebP, maksimal 5 MB) dan disimpan sebagai WebP pada folder upload bersama.
- `avatarPath` disimpan pada collection `designerprofiles`; file hanya disajikan melalui route foto profil yang memeriksa status publik atau sesi pemilik.


## Browser-first avatar and SVG upload reliability

- Designer Studio decodes and crops profile photos in the browser to 512 × 512 WebP (PNG fallback). The server validates image signatures and dimensions without requiring Sharp for profile avatars.
- Avatar storage preserves the detected WebP/PNG/JPEG extension and serves the matching MIME type from the guarded profile-avatar route.
- Portfolio SVG preview now attempts the original Figma SVG before the sanitized fallback. If browser rasterization fails, the original SVG is still submitted for server-side processing.
- The global UI cache key is versioned with each fix so stale browser scripts do not retain the old workspace click handler.
