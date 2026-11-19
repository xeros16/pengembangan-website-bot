# Laporan QA — Halaman Tentang / 2026-11-16aw

## Cakupan
- Menghapus padding atas wrapper editorial agar hero langsung menyambung ke navbar pada `/about` dan `/how-it-works`.
- Memastikan main shell, wrapper, dan hero memakai lebar viewport penuh.
- Menjaga kartu, copy, dan CTA tetap di grid konten terpusat.
- Memastikan halaman For Business tetap memakai aturan full-bleed khusus versi sebelumnya.

## Pemeriksaan browser
Dengan Chromium headless dan stylesheet proyek yang relevan, diuji pada lebar viewport yang mewakili zoom desktop 75%, 100%, 125%, 150%, serta mobile:

| Lebar viewport CSS | Hasil |
|---:|---|
| 1820 px | Lulus — hero mulai tepat setelah navbar, full-width, tanpa overflow |
| 1365 px | Lulus — hero mulai tepat setelah navbar, full-width, tanpa overflow |
| 1092 px | Lulus — hero mulai tepat setelah navbar, full-width, tanpa overflow |
| 910 px | Lulus — hero mulai tepat setelah navbar, full-width, tanpa overflow |
| 390 px | Lulus — hero mulai tepat setelah navbar, full-width, tanpa overflow |

Pada seluruh ukuran, jarak antara batas bawah navbar dan batas atas hero adalah 0 px. Lebar main shell, wrapper, dan hero sama dengan lebar viewport.

## Pemeriksaan otomatis
- Tes regresi About: 4/4 lulus.
- `npm run check`: lulus.
- Tes regresi About: 4/4 lulus.
- `npm test`: 228 lulus, 42 gagal. Jumlah kegagalan sama dengan baseline arsip sebelum revisi (224 lulus, 42 gagal); tidak ada kegagalan baru. Kegagalan yang tersisa sudah ada pada baseline dan berada di luar cakupan revisi ini. Dua tes cache-busting yang mengunci versi `20261116av` diperbarui ke versi rilis ini.

## Berkas yang diubah
- `pir-public-polish.css`
- `server.js` (cache-busting stylesheet `20261116aw`)
- `tests/about-fullbleed-spacing-20261116aw.test.js`
- Dokumen revisi dan laporan QA ini.
