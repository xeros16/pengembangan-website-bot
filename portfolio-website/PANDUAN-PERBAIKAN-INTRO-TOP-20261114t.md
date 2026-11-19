# PIR VISUALS — Revisi Intro, TOP, Hero & Marquee (14 November 2026)

## Pembaruan

- Intro PIR Visuals: ditahan 2.150 ms, transisi keluar 450 ms. Total animasi sekitar 2,6 detik (tidak termasuk waktu navigasi jaringan).
- TOP: sekarang tautan native `href="#pv-page-top"` dengan handler tunggal. Jika JS berjalan, klik membawa posisi ke atas **seketika**, menghindari konflik smooth scroll yang sebelumnya membuat tombol gagal. Jika pengaya JS gagal dijalankan, tautannya tetap bisa dipakai sebagai fallback.
- Hero: PORTFOLIO FIRST / DIRECT CONNECTION / BUILT FOR CREATIVES sekarang memiliki border atas dan bawah dalam elemen yang sama, padding simetris.
- Marquee: bergerak 36 px/detik saat normal (sebelumnya 44 px/detik), dan 4 px/detik setelah hover menurun secara bertahap.
- Versi aset di URL diubah ke `20261114t` untuk menghindari cache lama.

## Memasang

1. **Cadangkan folder `portfolio-website` dan `.env` terlebih dahulu.** Jangan bagikan `.env` / kata sandi.
2. Ekstrak **Part 1** dan **Part 2** pada lokasi yang sama, sehingga keduanya mengisi folder `portfolio-website` yang sama. Setujui penggantian file lama.
3. Jika belum terpasang, jalankan `npm ci --include=optional` dalam folder `portfolio-website`.
4. Restart proses Node.js (tutup terminal yang masih menjalankan `npm start`, lalu jalankan lagi).
5. Di Chrome tekan `Ctrl + Shift + R`. Pastikan di tab Network dimuat:
   - `/pir-intro-experience.js?v=20261114t`
   - `/pir-intro-experience.css?v=20261114t`
   - `/pir-back-to-top.js?v=20261114t`
   - `/pir-marquee.js?v=20261114t`

## Cara memeriksa

1. Klik logo PIR Visuals di navbar. Intro tampil sebelum perpindahan ke Beranda dan keseluruhan urutan pembukanya sekitar 2,6 detik.
2. Scroll sampai footer; klik atau fokus ke **TOP** lalu tekan Enter. Posisi scroll langsung ke 0.
3. Di hero, teks label harus berada di tengah dua garis hijau tipis.
4. Di ribbon bergerak, teks tetap melintas ke kiri tanpa berhenti; saat mouse berada di atasnya, gerak melambat sangat pelan.

## Hasil pengujian revisi

- Node.js syntax check: lulus untuk `server.js`, `pir-intro-experience.js`, `pir-back-to-top.js`, `pir-marquee.js`.
- 13/13 tes regresi khusus intro, TOP, hero, marquee, dan asset-version: lulus.
- Uji interaksi Chromium melalui HTML hasil server yang dimuat dalam browser uji terisolasi: TOP berhasil dari posisi scroll 4.121 px ke 0; 4 ukuran lebar layar (390, 768, 1365, 1920 px) lulus verifikasi TOP dan keseimbangan garis hero tanpa horizontal overflow.
- Gerak ribbon terukur ~33 px dalam 0,9 detik setelah aktif (~36 px/detik).
- Perilaku intro teramati masih aktif pada 1,8 detik, mulai keluar sebelum 2,48 detik, dan tertutup sebelum 2,86 detik. Waktu animasi dikendalikan oleh 2150 + 450 ms.

**Catatan:** Pengujian ini tidak menandakan website siap produksi. Database, SMTP, login semua peran, dan integrasi proyek tidak diuji ulang pada revisi tampilan ini. Chromium di lingkungan uji tidak diizinkan menavigasi langsung ke localhost, sehingga HTML hasil server di-inline untuk pengujian UI.
