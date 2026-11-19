# Revisi Stabilitas Alignment Judul Showcase — 19 November 2026

Memperbaiki judul yang kembali bergeser setelah carousel otomatis berpindah slide.

- Referensi pengukuran sekarang hanya mengambil `.pv-showcase-slide.is-active` pada panel yang terlihat.
- Titik sejajar diambil dari tepi konten panel kiri (border + padding), bukan kotak glyph judul slide.
- Alignment dijadwalkan ulang setiap kali slide aktif berubah, termasuk autoplay, tab, tombol, dan swipe.
- Perhitungan batas aman layar tetap dipertahankan.

Penyebab sebelumnya: selector mengambil heading dari slide pertama walaupun slide tersebut sudah `display:none`; saat carousel berganti, rect-nya menjadi nol dan script mereset posisi judul.

File utama: `pir-home-showcase.js`, `server.js`, dan tes `tests/showcase-heading-align-copy-20261119.test.js`.
