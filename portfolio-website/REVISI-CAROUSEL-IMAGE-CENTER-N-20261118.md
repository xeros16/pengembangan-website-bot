# Revisi Carousel — Image Center N (18 November 2026)

## Perubahan
- Memusatkan kotak gambar/video secara horizontal dan vertikal di dalam panel hijau kanan pada desktop.
- Gambar memakai ukuran intrinsik dengan batas ukuran area panel dan `object-fit: contain`, sehingga rasio asli tetap terjaga tanpa crop atau stretch.
- Inset panel dibuat seimbang agar ruang hijau di sekeliling gambar terlihat lebih rata.
- Posisi, ukuran, dan padding teks kiri tidak disentuh.
- Lebar kolom kanan, warna panel hijau, kontrol carousel, dan layout mobile tidak diubah.
- Cache key stylesheet diperbarui ke `20261118-image-center-n`.

## Validasi
- Pemeriksaan sintaks JavaScript server.
- Uji regresi aturan centering desktop dan perlindungan layout mobile.
