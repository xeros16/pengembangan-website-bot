# PIR Visuals · Revisi UI 20261115aa

## Perbaikan

- **Untuk Bisnis:** teks kecil “LET'S CREATE / PIR VISUALS”, heading, dan deskripsi CTA diselaraskan kontrasnya untuk panel hijau hutan. Tombol Lihat direktori dibuat terang agar lebih jelas.
- **Tiga kartu layanan bisnis:** label Cari spesialis, Lihat desainer, Cari kreator dipisahkan dari panah ↗ dengan jarak tetap; panah saja yang bergerak ketika tautan disentuh.
- **Shortlist:** panel pilihan desainer dan empty state memakai hierarki editorial, warna sage/ivory, garis pembatas halus, dan jarak yang lebih tertata.
- **Jelajahi:** gambar dekoratif hero di kanan diganti emblem PIR Visuals yang diposisikan dan diberi ukuran mengikuti area yang tersedia; disembunyikan pada layar kecil agar tidak menabrak teks. Bagian pencarian dan area hasil memakai variasi sage dan krem agar tidak serba putih.
- **Halaman internal:** panel konten pada halaman bisnis dan halaman terkait mengikuti ritme warna dari beranda tanpa mengubah fungsi backend.

## Cara memasang

1. **Cadangkan** folder `portfolio-website` yang sekarang dipakai, termasuk berkas `.env` aktif.
2. Ekstrak **Part 1** dan **Part 2** ke direktori induk yang sama. Keduanya memiliki folder `portfolio-website/` di dalamnya.
3. Bila menggantikan versi lama, pastikan file `pir-page-harmony.css` dan perubahan `server.js` telah masuk.
4. Jangan mengganti `.env` lama menggunakan `.env.example`.
5. Jalankan `npm ci --include=optional` bila dependensi belum terpasang, lalu jalankan `npm start` dengan database yang biasa digunakan.
6. Mulai ulang server dan di Chrome tekan **Ctrl + Shift + R**.
7. Di tab Network, pastikan `pir-page-harmony.css?v=20261115aa` berhasil dimuat.

## Pemeriksaan yang disarankan

- `/for-business`: warna CTA dan jarak panah ketiga kartu.
- `/shortlist`: tampilan sebelum dan setelah menambahkan desainer ke shortlist.
- `/discover`: emblem kanan pada hero; variasi latar panel pencarian dan hasil.
- `/about`, `/how-it-works`, `/categories`, dan `/contact`: konsistensi dengan tema tetap PIR Visuals.

**Batas pengujian:** Uji visual yang dilakukan menggunakan komposisi HTML dan seluruh stylesheet proyek dalam Chromium, bukan uji end-to-end dengan MongoDB produksi. Fungsi backend tetap perlu diuji pada database staging perusahaan.
