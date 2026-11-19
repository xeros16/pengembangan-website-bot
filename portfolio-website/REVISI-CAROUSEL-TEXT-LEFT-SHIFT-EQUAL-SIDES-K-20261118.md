# Revisi Carousel K — Geser Teks Kiri dan Samakan Sisi

- Memperbaiki sumber penyebab: `pir-home-showcase.js` sebelumnya memasang padding inline `!important` versi lama sehingga override CSS tidak terlihat.
- Padding kiri desktop sekarang `clamp(108px, 5.8vw, 120px)`, sehingga isi kolom kiri benar-benar bergeser ke kanan dari posisi sebelumnya.
- Padding kanan menggunakan nilai yang sama persis, sehingga harga dan tautan profil mengikuti inset kanan yang seimbang.
- Padding vertikal tetap 46px atas dan 42px bawah agar susunan vertikal carousel tidak berubah drastis.
- Gambar kanan, rasio gambar, dan tampilan mobile tidak diubah.
- Cache-busting versi CSS dan JavaScript diperbarui ke `20261118-copy-inset-k`.
