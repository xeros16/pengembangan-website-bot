# PIR Visuals — Perbaikan Footer Seal & FAQ (2026-11-14j)

## Perbaikan
1. Grafis kanan pada "Temukan talenta. Wujudkan ide besar." menjadi SVG mandiri berukuran proporsional (`pir-footer-seal.svg`) yang seluruh elemennya berada di dalam `viewBox`. Elemen cincin CSS dan gambar latar dekoratif lama yang melampaui batas kontainer dimatikan. Ini mencegah ilustrasi terpotong ketika ruang tampilan browser berubah.
2. Tiga FAQ di beranda memakai animasi buka/tutup ketinggian panel (~340 ms), tetap menggunakan elemen `<details><summary>` yang ramah aksesibilitas. Pergantian cepat dan keyboard didukung. Pilihan `prefers-reduced-motion: reduce` menonaktifkan animasi.
3. Asset cache diperbarui menjadi `pir-footer-refinement.css?v=20261114j` dan `pir-faq-accordion.js?v=20261114j`.

## Pemasangan
1. **Cadangkan** folder website dan file `.env` Anda. Jangan menyalin `.env` dari ZIP.
2. Ekstrak **Part 1**, lalu **Part 2**, ke satu folder yang sama sampai semua file bersatu di folder `portfolio-website`.
3. Jika sebelumnya memakai `portfolio-website` lama, *merge/replace* isi folder baru ke folder lama. Hindari folder `portfolio-website/portfolio-website`.
4. Di dalam `portfolio-website`, jalankan `npm ci --include=optional` jika dependensi belum dipasang.
5. Hentikan Node.js lama, lalu jalankan `npm start` (atau prosedur deployment Anda).
6. Di Chrome, buka `localhost:3080`, lakukan hard refresh (**Ctrl + Shift + R**). Periksa pada DevTools → Network bahwa stylesheet `pir-footer-refinement.css?v=20261114j`, JavaScript `pir-faq-accordion.js?v=20261114j`, dan SVG `pir-footer-seal.svg` dimuat dengan status 200.
7. Uji beranda pada 100%, 75%, 50%, dan 25% zoom. Klik masing-masing FAQ untuk memeriksa buka-tutup.

## Batas pengujian
- Node.js syntax check: lulus.
- 3 pengujian regresi khusus fitur baru: lulus.
- Chromium pada 7 lebar CSS (390, 768, 1024, 1365, 1920, 2560, 4096 px): grafis berada dalam wadah / sengaja disembunyikan pada layout mobile; aset termuat; tidak terdeteksi scroll horizontal.
- FAQ: klik buka-tutup, keyboard Enter, pilihan reduced motion, serta pengujian pergantian cepat lulus pada pemeriksaan terpisah.
- Suite tes historis parsial di paket website: 146/169 lulus; 23 kegagalan masih terkait dependensi root monorepo yang tidak disertakan dalam dua ZIP kecil, pemeriksaan versi lama, dan kontrak halaman terdahulu. Tidak berarti seluruh fitur backend telah tervalidasi untuk produksi.

## Berkas penting
- `portfolio-website/server.js` — struktur footer, script FAQ dan rute aset.
- `portfolio-website/pir-footer-seal.svg` — ilustrasi vektor baru, lengkap di dalam viewBox.
- `portfolio-website/pir-footer-refinement.css` — ukuran responsif dan aturan CTA/FAQ.
- `portfolio-website/pir-faq-accordion.js` — animasi FAQ.
- `portfolio-website/tests/footer-zoom-faq-20261114j.test.js` — pengujian regresi.
