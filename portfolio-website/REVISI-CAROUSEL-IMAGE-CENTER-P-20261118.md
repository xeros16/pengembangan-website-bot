# Revisi Carousel — Image Center P (18 November 2026)

## Perubahan
- Selector centering sekarang langsung menarget elemen media yang benar-benar berisi `img` atau `video`.
- Panel hijau tetap mengisi seluruh kolom kanan desktop.
- Gambar/video diposisikan tepat di tengah kedua sumbu dengan flex alignment.
- Ukuran media tetap mengikuti rasio intrinsik, memakai `object-fit: contain`, tanpa crop atau stretch.
- Kolom teks kiri dan layout tablet/mobile tidak diubah.
- Cache stylesheet diperbarui ke `20261118-image-center-q`.

## Pemasangan
1. Hentikan server website.
2. Ganti folder `portfolio-website` lama dengan folder dari ZIP revisi ini.
3. Pertahankan `.env` dan data lokal milik instalasi Anda; ZIP revisi tidak membawa secret atau session.
4. Jalankan kembali website dan lakukan hard refresh (`Ctrl + Shift + R`).

## Validasi
- Uji regresi centering desktop.
- Pemeriksaan sintaks `server.js` dan `pir-home-showcase.js`.
