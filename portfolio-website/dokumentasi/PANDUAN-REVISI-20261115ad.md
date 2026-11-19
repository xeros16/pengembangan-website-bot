# PIR Visuals — Revisi dekorasi & menu zoom (20261115ad)

Paket ini melanjutkan versi `20261115ac`. Kedua ZIP memiliki satu root folder `portfolio-website/`; ekstrak Part 1 dan Part 2 di direktori induk yang sama.

## Perbaikan

1. **Animasi dekorasi:** orbit dan ornamen bergerak membentuk lintasan kecil ke empat arah (bukan hanya naik–turun), siklus utama 8,8 detik dan alternatif 10 detik. Tidak mengubah native scrolling. `prefers-reduced-motion` dan mode animasi nonaktif dihormati.
2. **Shortlist:** ilustrasi kanan menampilkan wordmark *PIR VISUALS* menggunakan `pir-footer-seal.svg`. Dekorasi yang lebih halus masih hadir di mobile. Margin putih antara hero dan panel hasil dihilangkan.
3. **Menu saat zoom:** dropdown responsif menggunakan hijau hutan dan teks terang agar menu selain yang aktif tetap terbaca. Pada lebar viewport kecil, tautan menu utama ditampilkan satu kolom. Panel dijaga dalam viewport dengan scroll internal bila perlu.
4. **Kategori:** panel “Find your creative language.” memiliki lebar full-bleed seperti Beranda. CSS memperbaiki selector ke `.category-editorial > .category-intro`, karena elemen aslinya bersarang dalam kontainer.

## Cara memasang

1. Cadangkan proyek sebelumnya serta `.env` Anda.
2. Ekstrak **Part 1** lalu **Part 2** ke lokasi induk yang sama. File akan tergabung di folder `portfolio-website/`.
3. Dari folder itu, jalankan `npm ci --include=optional` bila dependensi belum terpasang secara benar.
4. Restart server Node.js (`npm start`).
5. Tekan **Ctrl + Shift + R** di Chrome agar CSS versi `20261115ad` dimuat.

Periksa terutama `/shortlist`, `/categories`, dan menu navigasi pada zoom 150%–200%.

## Catatan verifikasi

- Lulus pemeriksaan sintaks JavaScript melalui `npm run check`.
- Lulus 10/10 tes spesifik stylesheet dan selector pada `tests/public-polish-20261115ac.test.js` dan `tests/zoom-menu-ornaments-20261115ad.test.js`.
- Lulus 10/10 kombinasi simulasi Chromium (dua halaman × lima lebar viewport: 390, 520, 768, 1365, dan 1920 px), menggunakan HTML representatif dengan stylesheet lengkap dari proyek. Tidak ada overflow horizontal; full-width tepat sampai tepi; gap antarseksi Shortlist 0 px; menu kompak menggunakan warna dengan kontras jelas.
- Server produksi dengan database nyata **belum diuji**. Server lokal saat pengujian tidak dapat dijalankan karena folder `node_modules/sharp` dalam salinan kerja tidak lengkap; paket ZIP tidak menyertakan `node_modules`.
