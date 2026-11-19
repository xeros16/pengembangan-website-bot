# PIR Visuals — Revisi tampilan 20261115ac

Paket ini meneruskan versi 20261115ab. Kedua ZIP berisi folder induk `portfolio-website/` dan dapat diekstrak pada lokasi yang sama.

## Perubahan

- Dekorasi kanan pada **Jelajahi, Kategori, Tentang, Untuk Bisnis, dan Shortlist** menggunakan animasi naik-turun kecil (~11–13 detik per siklus) agar tidak diam statis. Animasi tidak mengubah scroll mouse, tidak menghalangi klik, dan nonaktif bila `prefers-reduced-motion: reduce` atau mode animasi situs dimatikan.
- **Contact & Support**: teks hero putih/ivory dipaksakan secara khusus setelah aturan tema lama yang membuat judul nyaris hilang.
- **Kategori**: panel *Find your creative language.* menjadi full-bleed sepanjang lebar viewport, sedangkan isi tetap memiliki padding yang nyaman.
- **Shortlist**: hero serta area pilihan juga penuh lebar viewport; toolbar dan kartu di dalamnya tetap terpusat dan dibatasi lebar baca.
- **Beranda**: daftar 01–03 disusun tanpa `gap` di antara baris, sehingga jarak teks terhadap garis atas dan bawah tidak timpang.

## Pemasangan

1. Simpan cadangan folder proyek beserta `.env` Anda.
2. Ekstrak **Part 1** dan kemudian **Part 2** pada folder induk yang **sama**; keduanya menyatu ke dalam folder `portfolio-website/`.
3. Dari folder `portfolio-website/`, jalankan `npm ci --include=optional` apabila dependensi belum tersedia.
4. Jalankan ulang `npm start` dan lakukan hard refresh browser (**Ctrl + Shift + R**).
5. Pastikan tab Network memuat `pir-public-polish.css?v=20261115ac`.

Catatan: pemeriksaan desain menggunakan Chromium dengan CSS penuh dan HTML representatif. Integrasi database produksi belum diuji; ini versi staging.
