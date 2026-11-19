# Laporan QA · PIR Visuals 20261115aa

## Cakupan yang sudah diperiksa

- Browser Chromium headless: 3 variasi halaman (Untuk Bisnis, Shortlist, Jelajahi) × 4 lebar layar (390, 768, 1365, 1920 px) = **12 skenario simulasi layout**.
- Tidak ditemukan horizontal overflow ataupun page error di 12 simulasi.
- Kontras dan pewarnaan CTA bisnis serta panel Shortlist diuji melalui computed styles.
- Emblem hero Jelajahi diuji pada lebar 390 dan 1365 px dengan ukuran yang tidak melewati area konten. Pada layar sempit dekorasi disembunyikan.
- Pengujian khusus perubahan `server.js` dan `pir-page-harmony.css`: **7/7 tes lulus**.
- `npm run check` dan pemeriksaan sintaks JavaScript server: lulus.

## Batasan

- Pengujian visual dilakukan memakai fixture HTML dari markup proyek dan stylesheet asli. Chromium lingkungan ini memblokir navigasi ke server localhost/file, sehingga screenshot tidak merupakan bukti uji browser pada sistem produksi.
- Tidak ada database MongoDB yang aktif pada lingkungan ini; pencarian database, profil desainer, sistem shortlist yang terisi, dan alur autentikasi belum diuji end-to-end.
- Website tetap diposisikan sebagai staging sampai integrasi backend/divisi keamanan lulus pengujian terpisah.
