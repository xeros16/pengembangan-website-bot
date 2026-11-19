# Laporan QA — Revisi AM

## Lingkungan pemeriksaan
Chromium headless melalui Playwright Python, fixture markup yang mencerminkan kelas DOM halaman `/discover` dan stylesheet yang sama dengan website. Ini adalah uji visual CSS, bukan uji integrasi database produksi.

## Animasi
- CSS pseudo-element dekorasi: `animation-name = pv-am-continuous-orbit`.
- Nilai `offset-distance` berubah sepanjang 3,2 detik pada Chromium: sekitar `0,8%` → `19,1%` → `37,3%`.
- Saat `prefers-reduced-motion: reduce`, `animation-name = none` (sesuai aksesibilitas).

## Vertikal dan horizontal
- Desktop viewport 1365 px: padding atas = bawah = 76,44 px; jarak aktual panel terhadap batas band = 77,44 px di kedua sisi.
- Simulasi zoom CSS 75% dan 125% pada viewport 1365: jarak kedua sisi seimbang dan tidak ada overflow horizontal.
- Ponsel viewport 390 px: padding atas = bawah = 42 px; jarak aktual panel terhadap band = 43 px.

## Pemeriksaan sintaks
- `node --check server.js`: lulus.
- Browser mendekode dan menerapkan CSS serta keyframes tanpa kesalahan yang teramati.

## Batasan
Tidak dapat menguji website aktual pada localhost pengguna atau alur MongoDB dari lingkungan ini; pengujian menyeluruh di lingkungan staging tetap direkomendasikan sebelum produksi.
