# PIR Visuals — Revisi footer & navbar (2026-11-14h)

## Apa yang berubah

1. Footer baru mengikuti **susunan editorial** pada referensi: panel utama yang ekspresif, identitas merek besar, tiga kolom tautan, lanskap ilustratif, dan garis informasi hak cipta. Seluruh tulisan, ikon, dan ilustrasi tetap identitas **PIR Visuals** dan bukan salinan aset Bettr Academy.
2. Bagian awal footer memakai judul editorial “Temukan talenta. Wujudkan ide besar.”, warna hijau hutan, serta elemen abstrak yang selaras dengan hero “Ide berani. Karya berarti.”
3. Bagian bawah footer memakai latar sage, wordmark PIR VISUALS besar, navigasi Jelajahi/Perusahaan/Untuk Kreator, dan ilustrasi SVG orisinal.
4. Item navbar aktif kini menggunakan hijau medium `#365B40` dengan teks ivory terang; tidak ada lagi teks putih di atas tombol putih.
5. Tema tetap/permanen dari versi sebelumnya dipertahankan. Tidak ada Light/Dark Mode.

## Cara memasang kedua ZIP

1. Cadangkan folder website lama dan `.env` perusahaan.
2. Ekstrak **Part 1** dan **Part 2** ke **folder induk yang sama**, sehingga semua file berada pada path `portfolio-website/` serta file panduan pada root.
3. Timpa file lama di `portfolio-website/`. Jika Anda memakai proyek monorepo yang juga memuat bot, **jangan hapus** file fitur bot lain yang tidak termasuk paket ini.
4. Dari folder `portfolio-website`, jalankan `npm ci --include=optional` (Node.js sesuai README), lalu restart server yang berjalan di localhost:3080.
5. Lakukan hard refresh Chrome: **Ctrl+Shift+R**. Periksa tab **Network** untuk memastikan `pir-footer-refinement.css?v=20261114h` dan `pir-footer-landscape.svg` memuat status 200.
6. Periksa navigasi `/`, `/discover`, `/for-business` dan footer pada desktop/ponsel.

## Pemeriksaan

- **35/35** skenario UI (7 rute × 5 lebar: 390, 768, 1024, 1365, 1920 px) lulus dalam Chromium pada markup yang diambil dari server uji. Pemeriksaan meliputi horizontal overflow, lebar footer dan navbar, warna item aktif, tanpa tombol tema, dan aset ilustrasi.
- **13/13** pengujian kode relevan (tiga file tes) lulus.
- **Node.js syntax check**, parser CSS, dan validasi SVG lulus.
- Suite lama website secara keseluruhan: **426/449 tes lulus**. Sebagian kegagalan masih dari metadata versi warisan, sementara beberapa tes lama masih mengasumsikan tombol tema/struktur footer lama. Jangan gunakan angka 13/13 untuk menyimpulkan seluruh proyek bebas error.
- Koneksi produksi MongoDB, pengiriman email, autentikasi, unggahan portofolio, dan project workspace **belum diuji secara live** dalam revisi UI ini. Status tetap **staging**, belum ada klaim siap produksi.

## File utama yang diubah / ditambah

- `portfolio-website/server.js` — markup footer, pemuatan CSS versi baru, dan route aset SVG.
- `portfolio-website/pir-footer-refinement.css` — navbar aktif, footer editorial responsif, dan kontras.
- `portfolio-website/pir-footer-landscape.svg` — ilustrasi orisinal.
- `portfolio-website/tests/footer-navbar-20261114h.test.js` — pengujian regresi perubahan.

**Catatan:** Footer memuat ilustrasi SVG lokal secara `loading="lazy"`; gambar baru dimuat browser saat bagian footer mendekati viewport. Ini normal dan bukan bug.
