# Update PIR Visuals — 15 November 2026 (AK)

Revisi halaman `Jelajahi` (`/discover`) berdasarkan screenshot terbaru:

1. Memindahkan dekorasi melingkar PIR Visuals ke **tengah kanan hero** dan menghapus pergerakan jalur yang menggeser emblem dari posisi semula. Lingkar luar masih memiliki animasi napas berupa perubahan opacity yang halus, tanpa gerakan posisi.
2. Menambahkan **band full-width** (`.pv-discovery-search-band`) di belakang panel Cari talenta, mirip komposisi section penuh pada Beranda.
3. Mempertahankan card pencarian di tengah dengan warna berbeda dari latar band.
4. Menyeimbangkan jarak atas-bawah, termasuk pada ukuran ponsel.
5. Memperbarui nomor versi CSS menjadi `20261115ak` agar perubahan tidak tertahan cache.

File yang berubah: `server.js`, `pir-public-polish.css`. Source lain disertakan lengkap dalam folder.

## Pemasangan

Ekstrak Part 1 (folder `portfolio-website`) ke folder proyek Anda, timpa file versi lama, lalu jalankan ulang server dengan `npm start` dan tekan `Ctrl + Shift + R` di Chrome.

**Catatan verifikasi:** pengujian produksi dengan database serta verifikasi visual pada mesin Anda tetap perlu dilakukan sebelum peluncuran publik.
