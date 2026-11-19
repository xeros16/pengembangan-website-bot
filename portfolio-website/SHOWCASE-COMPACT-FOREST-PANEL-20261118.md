# PIR Visuals — Compact Forest Panel and Full Artwork Fit

Tanggal: 18 November 2026

## Perubahan
- Latar hijau tua dibatasi hanya pada kolom gambar di sisi kanan carousel desktop.
- Area kontrol carousel di bawah slide kembali transparan mengikuti latar halaman; tidak ada lagi bidang hijau yang memanjang di bawah gambar.
- Gambar/video diperbesar agar memenuhi ruang yang tersedia di dalam panel hijau.
- `object-fit: contain` dan posisi tengah dipertahankan agar keseluruhan gambar terlihat, tanpa crop atau stretch.
- Pembagian teks dan media desktop tetap 50:50; ukuran dan jarak tipografi kiri tidak diubah.
- Tablet dan mobile tetap menggunakan susunan teks di atas, gambar di bawah, dengan rasio asli dan tanpa pemotongan.
- File karya asli tidak diubah.

## Validasi
- 43 pengujian showcase: PASS.
- `node --check` pada file server dan skrip showcase: PASS.
- Seluruh suite proyek: 521 PASS, 73 FAIL pada pengujian lain yang tidak terkait revisi showcase ini.
