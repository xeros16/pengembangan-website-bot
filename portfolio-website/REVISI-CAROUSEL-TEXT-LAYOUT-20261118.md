# Revisi Carousel — Tata Letak Teks Panel Kiri

Tanggal: 18 November 2026

## Perubahan
- Susunan masthead/judul utama di atas carousel dikembalikan ke layout sebelumnya; tidak dibuat rata tengah atau ditambahkan kotak/garis baru.
- Pada panel kiri setiap slide: label kategori dan harga tetap sejajar di bagian atas.
- Judul berada di kiri atas setelah baris label/harga.
- Deskripsi dipindahkan tepat setelah judul, bukan didorong ke bagian paling bawah panel.
- Garis putus-putus dan informasi kreator tetap di bagian bawah; tombol CTA tetap di kiri bawah.
- Perubahan urutan dan jarak teks juga diterapkan pada tampilan tablet/mobile.
- Kolom gambar kanan, rasio gambar, warna, font, ukuran teks, serta aturan gambar mobile tidak diubah.
- Cache stylesheet diperbarui ke `20261118y`.

## Validasi
- `npm run check`: lulus.
- Pengujian carousel terpilih: 22/22 lulus.
- Pengujian penuh proyek: 530 lulus, 73 gagal. Kegagalan yang tersisa berada pada area lain (cache/release metadata, navigasi, FAQ, animasi, dan fitur lain), bukan pada pengujian carousel yang ditargetkan.
