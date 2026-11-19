# Laporan singkat QA — PIR Visuals 20261114t

**Cakupan:** intro 2,6 detik; kontrol kembali ke atas; posisi label hero; laju marquee.

- 13 dari 13 tes regresi lulus.
- Browser terisolasi Chromium pada lebar 390, 768, 1365, dan 1920 px: TOP berfungsi dan tidak ada horizontal overflow; jarak teks hero ke garis atas dan bawah identik.
- Uji desktop: posisi scroll 4.121 px menjadi 0 setelah klik TOP.
- Marquee normal terukur 33 px dalam 0,9 detik.
- Intro memakai 2.150 ms hold + 450 ms exit; rendering perangkat lain dapat bervariasi beberapa frame.
- Hasil tidak mencakup sertifikasi produksi atau pengujian database.
