# Hasil QA animasi PIR Visuals — 2026-11-14k

- Kode `server.js`, `pir-faq-accordion.js`, dan `pir-scroll-experience.js` lolos `node --check`.
- Asset `/pir-scroll-experience.js?v=20261114k` dan halaman utama merespons HTTP 200 di server uji Node.
- Chromium headless pada lebar **390, 768, 1365, 1920 px**: ketiga FAQ tersedia, FAQ pertama terbuka normal, klik beruntun saat transisi berakhir dengan state benar, FAQ kedua terbuka/tertutup menggunakan Enter, scroll roda mouse bergerak bertahap, tidak ada horizontal overflow atau exception JavaScript.
- `prefers-reduced-motion: reduce`: FAQ langsung terbuka tanpa transisi.
- Tes khusus **6/6 lulus** (`faq-scroll-motion-20261114k` dan `footer-zoom-faq-20261114j`), sesuai kontrak versi baru.
- Suite website penuh: **149/172 lulus, 23 gagal**. Baseline versi sebelumnya: **146/169 lulus, 23 gagal**. Selisih lulus berasal dari 3 tes baru dan penyesuaian tes versi sebelumnya.
- **Belum dilakukan:** benchmark scrolling pada perangkat pengguna fisik, pemeriksaan seluruh integrasi MongoDB/SMTP, keamanan untuk rilis produksi.
