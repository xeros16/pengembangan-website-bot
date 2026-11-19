# PIR Visuals — Pembaruan Loader dan FAQ (2026-11-14q)

## Yang diubah

- Tiga judul pertanyaan di beranda (Questions, answered.) memakai humanist sans **Trebuchet MS** dengan fallback Segoe UI/Arial, ukuran responsif dan bobot 600. Heading bagian kiri tetap memakai serif editorial.
- Intro satu kali per tab/sesi browser, khusus rute publik: `/`, `/discover`, `/about`, `/for-business`, `/contact`, `/categories`, `/how-it-works`, `/commands`.
- Intro menggunakan warna sage, wordmark PIR Visuals, serta ilustrasi SVG asli berupa pensil dan unsur daun. Tidak menggunakan aset Bettr Academy.
- Intro dapat dilewati lewat tombol `Lewati animasi` atau `Escape`. Hilang otomatis dalam sekitar 1–2 detik, dan tidak aktif bila preferensi `prefers-reduced-motion: reduce` menyala.
- Jika JavaScript tidak aktif, intro tidak ditampilkan sehingga halaman tetap dapat diakses.

## Pemasangan

1. **Backup** folder `portfolio-website` serta `.env` Anda.
2. Ekstrak ZIP **Part 1** dan **Part 2** ke folder induk yang sama. Kedua arsip bergabung ke direktori `portfolio-website/`.
3. Jangan hapus `.env` dan database yang sudah dipakai. Jika belum terpasang, jalankan `npm ci --include=optional` sesuai lingkungan server.
4. Hentikan lalu jalankan ulang proses Node (`npm start` sesuai konfigurasi Anda).
5. Di browser, tekan `Ctrl+Shift+R`. Pastikan empat aset baru memberi HTTP 200 melalui Network:
   - `pir-intro-experience.css?v=20261114q`
   - `pir-intro-boot.js?v=20261114q`
   - `pir-intro-experience.js?v=20261114q`
   - `pir-intro-sticker.svg`
6. Animasi hanya muncul pertama kali dalam sebuah tab browser. Untuk **preview manual tanpa perlu menutup tab**, buka `http://localhost:3080/?pv_intro=1`.
7. Cek ukuran desktop dan mobile; coba tombol lewati, Escape, pindah ke `/discover`, serta klik FAQ.

## Status verifikasi

- `node --check` untuk server dan dua file JS baru: lulus.
- 5 pengujian regresi baru: lulus.
- HTTP untuk HTML, CSS, JS, dan SVG pada server QA lokal: 200.
- Browser Chromium di lingkungan tugas **memblokir navigasi ke halaman lokal**, sehingga verifikasi visual end-to-end pada browser belum bisa dinyatakan lulus. Uji manual di Chrome pada lingkungan Anda tetap diperlukan.
- Kesiapan backend untuk produksi (database, pengiriman email, akun pengguna) tidak diuji ulang dalam perubahan ini.
