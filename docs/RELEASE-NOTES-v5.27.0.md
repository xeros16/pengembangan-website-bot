# PIR Visuals v5.27.0 — Full Foundation Upgrade

## Perubahan
- Memperbarui metadata versi bot ke 5.27.0.
- Menambahkan `.env.example` root yang aman sebagai template konfigurasi bot.
- Menambahkan `.env.example` khusus website dan dokumentasi Windows/local deployment.
- Website tetap project Node.js terpisah dari proses Baileys dan Game Center.
- Homepage website menjadi direktori desainer publik dengan pencarian nama, bio, lokasi, skill, dan filter verified.
- Menambahkan dashboard ringkasan Owner read-only di `/dashboard`, dilindungi HTTP Basic Auth dan dinonaktifkan jika kredensial kuat belum dikonfigurasi.
- Menambahkan `/robots.txt` dan `/sitemap.xml`.
- Menambahkan security headers untuk halaman HTML.
- Analytics tidak lagi mempercayai `X-Forwarded-For` yang dikirim langsung oleh klien.
- Menambahkan tes regresi website dan keamanan.

## Fitur yang tetap dipertahankan
- Baileys 6.7.24.
- MongoDB dan koleksi direktori desainer yang kompatibel.
- Portofolio, layanan, harga, verified/featured, kontak langsung.
- Game Center dan Pixel Realm tetap berada di folder `games/`.

## Batasan yang belum selesai
- Dashboard ini adalah dashboard Owner read-only, bukan dashboard self-service desainer.
- Login desainer email/password dan verifikasi WhatsApp sebagai 2FA belum diimplementasikan.
- QR page masih memakai provider eksternal.
- Pengujian end-to-end memerlukan MongoDB dan sesi WhatsApp nyata; tidak diklaim lulus tanpa environment tersebut.

## Validasi lokal pada paket ini
- `node scripts/check-js.js`: lulus, 169 file JavaScript.
- Website tests: 5/5 lulus.
- Root tests: 317 lulus, 7 gagal saat environment ini tidak memiliki dependensi runtime `node-fetch` (npm offline install tidak dapat mengambil paket yang tidak ada di cache). Kegagalan ini bukan ditandai sebagai lulus.
- Tidak dilakukan uji integrasi live ke MongoDB atau sesi Baileys karena memerlukan konfigurasi pengguna.

## Windows local
- Bot: dari root jalankan `npm install` (atau `npm ci` jika lockfile cocok), lalu `npm start`.
- Website: `cd portfolio-website`, `npm install`, salin `.env.example` menjadi `.env`, isi variabel, lalu `npm start`.
- Untuk akses publik sementara, gunakan Cloudflare Quick Tunnel ke port website. Komputer dan kedua proses terkait harus tetap aktif.
