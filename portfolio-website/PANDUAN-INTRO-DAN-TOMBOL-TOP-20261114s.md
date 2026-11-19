# PIR Visuals — revisi animasi intro & tombol TOP (2026-11-14s)

## Yang berubah

1. Animasi intro berlangsung sekitar **3,4 detik**, lalu transisi penutupan **0,62 detik** (saat hanya memutar ulang dari Beranda).
2. Klik **logo PIR Visuals pada header** memulai animasi di halaman saat ini **sebelum navigasi**. Pada Beranda, klik logo hanya memutar ulang animasi tanpa memuat ulang halaman. Pada halaman lain, setelah intro selesai browser baru pindah ke Beranda.
3. Tombol **TOP** menggunakan handler independen dan scrolling bawaan browser. Tombol muncul setelah halaman digulir sekitar 240 piksel, dan menghilang kembali ketika mencapai atas.
4. Loader punya progress line dan tombol **Lewati animasi**; aksesibilitas `prefers-reduced-motion` dihormati.

## Instalasi revisi

- Cadangkan terlebih dahulu folder project serta `.env` lokal. ZIP tidak menyertakan `.env` operasional.
- Ekstrak **Part 1** dan kemudian **Part 2** ke folder **yang sama**, sehingga file bertemu dalam `portfolio-website`.
- Saat upgrade dari revisi sebelumnya, **timpa** file dengan nama sama, khususnya `server.js`, `pir-intro-experience.js`, `pir-intro-experience.css`, dan file baru `pir-back-to-top.js`.
- Pastikan dependensi sesuai OS (`npm ci --include=optional` bila belum terinstal), lalu restart Node.js.
- Gunakan **Ctrl + Shift + R** di Chrome jika masih melihat cache lama. Periksa Network untuk `pir-intro-experience.js?v=20261114s`, `pir-intro-experience.css?v=20261114s`, dan `pir-back-to-top.js?v=20261114s`.

## Uji manual yang disarankan

- Dari Beranda, klik logo: intro muncul seketika, tanpa refresh halaman; sesudah ~4 detik kembali ke Beranda.
- Dari `/discover`, klik logo: intro muncul lebih dulu, kemudian berpindah ke `/`.
- Klik **Lewati animasi**: intro berakhir lebih cepat.
- Scroll ke bawah dan klik **TOP**: posisi scroll kembali ke awal dan tombol hilang.
- Periksa Chrome desktop/mobile, zoom 100% dan 75%, serta pengaturan reduced motion.

## Status verifikasi

- Pemeriksaan sintaks Node.js **lulus**.
- Pengujian khusus fitur baru **14/14 lulus**.
- Browser Chromium melalui HTML yang disajikan server dengan skrip lokal disisipkan ulang: klik logo menunjukkan overlay sebelum navigasi; TOP membawa scroll dari 4055px ke 0px. Akses Chromium langsung ke `127.0.0.1` dibatasi lingkungan uji, jadi pengujian E2E penuh berbasis URL belum dapat dinyatakan lulus.
- Suite historis: **173/203 lulus**, 30 pemeriksaan lama/gabungan belum lulus. Backend produksi tidak ikut diaudit pada revisi UI ini.

**Status: staging / uji**, belum sign-off produksi.
