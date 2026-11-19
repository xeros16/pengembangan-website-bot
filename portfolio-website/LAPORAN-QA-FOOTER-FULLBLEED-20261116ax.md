# Laporan QA — Footer Full-Bleed / 2026-11-16ax

## Pemeriksaan sumber
- `footer.foot.pv-footer` adalah anak langsung dari `#main-content`.
- Footer sebelumnya memakai offset gutter lama yang tidak lagi konsisten ketika shell About diperlebar.
- Override baru memakai titik tengah wrapper (`50%`) dikurangi setengah lebar viewport (`50vw`), sehingga tetap bekerja saat wrapper dibatasi maupun saat wrapper sudah full-width.
- Beranda dikecualikan dari override karena memiliki layout footer tersendiri.
- Cache-busting stylesheet publik dinaikkan dari `20261116aw` ke `20261116ax`.

## Hasil otomatis
- `npm run check`: lulus.
- Tes terarah About, Favorit, Shortlist, dan footer: **17/17 lulus**.
- Seluruh suite setelah patch: **245 lulus, 47 gagal** dari 292 tes.
- Baseline arsip sebelum patch: **241 lulus, 47 gagal** dari 288 tes.
- Tidak ada kelompok kegagalan baru; 44 kelompok gagal yang sama tetap ada pada baseline. Empat tes regresi baru seluruhnya lulus.

## Pemeriksaan visual
- Browser headless pada lingkungan pemeriksaan ini menolak membuka fixture lokal (`ERR_BLOCKED_BY_ADMINISTRATOR`), sehingga pengukuran visual langsung tidak dapat dilakukan di sini.
- Verifikasi visual akhir tetap disarankan pada browser lokal setelah server dimulai ulang dan cache browser diperbarui.

## Catatan pemasangan
- Paket perbaikan tidak menyertakan `.env` atau `node_modules`.
- Pertahankan `.env` milik proyek lama dan gunakan dependensi yang sudah terpasang, atau jalankan `npm ci` bila memasang dependensi baru.
