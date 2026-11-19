# Laporan pengujian tampilan · 20261115ac

Pengujian dilakukan memakai Chromium headless dan gabungan **semua stylesheet** proyek. Halaman yang diuji dalam fixture representatif: Contact & Support, Kategori, Shortlist, dan Beranda.

- Resolusi: 390 px, 768 px, 1365 px, 1920 px.
- **16/16 kombinasi** tidak memiliki scroll horizontal.
- Warna heading Contact & Support: `rgb(243, 247, 236)` (teks terang).
- Batas kiri dan kanan masthead Kategori serta Shortlist: `0 px` dan lebar viewport.
- Pusat teks langkah 01–03: selisih dengan pusat baris maksimum ±1 px.
- Dekorasi: animasi float dapat aktif di desktop dan nonaktif pada `prefers-reduced-motion`.

**Batas pengujian:** Fixture menggunakan markup halaman representatif dan semua CSS aktual, bukan seluruh alur backend. Database/MongoDB produksi dan formulir live tidak diuji. Untuk rilis produksi, lanjutkan staging dengan database nyata.
