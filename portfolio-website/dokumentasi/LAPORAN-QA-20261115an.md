# QA PIR Visuals — Discover AN

- Hasil statis: `npm run check` berhasil.
- Hasil regresi: 3/3 tes lulus.
- Hasil Playwright Chromium: posisi pusat dekorasi sama dengan pusat hero pada ukuran 1365 px, center Y = 458,55 px; pita full width dengan jarak atas-bawah = ~71 px; tidak ada horizontal overflow pada 1365/1000/768/390 px.
- Dekorasi tampil pada desktop dan disembunyikan pada mobile; gerak nested transform berubah antarframe.
- QA belum mencakup integrasi database produksi atau seluruh alur navigasi website.
