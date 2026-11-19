# Laporan ringkas pengujian

Tanggal: 14 November 2026

**Perubahan:** menghilangkan interpolasi roda mouse berbasis JavaScript; menjaga smooth-scroll native untuk tautan anchor; mengurangi repaints latar dan menghentikan marquee saat offscreen.

**Hasil:** `npm run check` lulus; 5/5 pengujian regresi baru lulus; 3 ukuran viewport pada Chromium sintetis lulus (wheel native, anchor, dan offscreen marquee), termasuk reduced-motion. Suite historis: 153/183 lulus, 30 gagal.

**Batas verifikasi:** uji browser mengisolasi scrolling melalui HTML sintetis karena navigasi loopback Chromium diblokir oleh lingkungan browser; bukan audit performa frame-time pada Windows pengguna atau verifikasi semua alur produksi.

**Status:** revisi frontend untuk staging, belum siap produksi.
