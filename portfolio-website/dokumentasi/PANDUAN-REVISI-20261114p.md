# PIR Visuals — Revisi Konsistensi Layout Seluruh Halaman (2026-11-14p)

Pembaruan ini memperbaiki navbar yang tampak bergeser ke kanan di halaman selain Beranda, dan menyatukan hierarki warna, tipografi, hero, serta formulir pada halaman Jelajahi, Tentang, Untuk Bisnis, Cara Kerja, Kategori, dan Kontak/Bantuan.

## Pemasangan pada proyek yang sudah berjalan

1. **Cadangkan** folder `portfolio-website` saat ini, terutama `.env`, database, dan setiap file konfigurasi operasional. Jangan menimpa `.env`.
2. Matikan server Node.js lama.
3. Ekstrak ZIP Part 1 dan Part 2 ke **folder induk yang sama**. Keduanya berisi folder bernama `portfolio-website`; pilih untuk mengganti file lama pada folder proyek yang sudah ada.
4. Dari folder `portfolio-website`, jalankan `npm ci --include=optional` bila dependensi perlu dipasang kembali. Anda juga bisa memakai dependensi yang sebelumnya sudah berfungsi.
5. Jalankan `npm start` (atau mekanisme proses server yang sebelumnya digunakan).
6. Buka `http://localhost:3080` dan lakukan hard refresh `Ctrl + Shift + R`. Periksa tab Network bahwa `pir-site-consistency.css?v=20261114p` dan `pir-editorial-reveal.js?v=20261114p` berhasil dimuat dengan status 200.
7. Uji Beranda, Jelajahi, Untuk Bisnis, Tentang Kami, Cara Kerja, Kategori, dan Kontak pada desktop maupun mobile.

## Yang berubah

- **Navbar**: lebar `100vw` disejajarkan dengan pusat viewport, bukan margin negatif yang ditebak berdasarkan padding; tidak ada horizontal overflow di halaman dalam.
- **Desain**: hero halaman Jelajahi memakai hijau hutan dan tipografi editorial. Bagian halaman yang lebih ringan memakai sage/ivory; form, input, kartu dan judul diberi aturan konsisten.
- **Scrolling**: scroll fisik tetap native (tanpa listener `wheel` dan tanpa interpolasi posisi scroll buatan). Halaman internal memiliki *once-only section reveal* yang sangat ringan pada area di bawah viewport, bukan pada navbar/form yang aktif.
- **Aksesibilitas**: efek reveal otomatis tidak dipakai jika sistem meminta *reduced motion*; menu mobile dan kontrol filter tetap menggunakan mekanisme interaksi yang sudah ada.

## Status pengujian

- Pemeriksaan browser headless: 85/85 lulus untuk 8 rute pada 3 lebar layar (390, 1365, 1920 px), termasuk kontrol filter dan menu mobile yang relevan.
- 6/6 tes regresi baru lulus.
- Syntax check Node.js lulus.
- Suite historis: 159/189 tes lulus, 30 gagal. Jumlah kegagalan sama dengan baseline sebelumnya (153/183) sebelum 6 tes baru ditambahkan; tes historis tersebut **belum** dianggap selesai.
- Belum ada sertifikasi produksi dengan database, SMTP, akun pengguna nyata, dan server perusahaan. Gunakan untuk **staging** terlebih dahulu.

## Catatan penting tentang referensi Bettr Academy

Revisi ini memakai pendekatan ritme editorial dan transisi yang ringan, bukan menyalin aset, warna, atau sistem scroll proprietary. Scroll wheel dan touchpad sengaja tetap native agar tidak mengulang masalah tersendat dari revisi sebelumnya.
