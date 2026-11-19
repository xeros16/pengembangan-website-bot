# Laporan QA — Footer & FAQ (2026-11-14j)

| Pemeriksaan | Hasil |
|---|---|
| HTTP rute utama (server QA) | 200 |
| SVG `/pir-footer-seal.svg` | 200 image/svg+xml |
| JS `/pir-faq-accordion.js` | 200 application/javascript |
| `npm run check` | Lulus |
| Test regresi terkait | 3/3 lulus |
| Chromium viewport 390–4096px | 7/7 tanpa overflow horizontal |
| SVG desktop 1024–4096px | Sepenuhnya berada di dalam panel |
| FAQ dibuka-ditutup | Lulus |
| FAQ seluruh 3 pertanyaan | Lulus |
| FAQ keyboard Enter | Lulus |
| FAQ reduced-motion | Lulus |
| Test historis website | 146/169 lulus (23 gagal) |

Render browser dilakukan dari HTML dan CSS yang diambil dari server QA lokal dan dimuat ulang di Chromium melalui dokumen inline karena kebijakan browser uji membatasi navigasi ke localhost. Data bisnis pada server QA menggunakan mock kosong, bukan database produksi.

**Status:** layak diperiksa dalam staging sebagai revisi UI; belum ada verifikasi menyeluruh untuk rilis produksi.
