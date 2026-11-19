# Laporan QA — Creative Studio Hero Text Stack

Tanggal: 16 November 2026
Versi: 3.50.4

## Hasil perubahan
- Judul tetap menjadi elemen pertama pada hero.
- Deskripsi dipindahkan ke baris di bawah judul.
- Statistik fitur ditempatkan setelah deskripsi.
- Jalur teks dibatasi maksimal 760 px dan 58vw pada desktop/tablet untuk menjaga ruang ornamen kanan.
- Pada layar <= 760 px, jalur teks kembali menggunakan lebar penuh; ornamen disembunyikan oleh aturan ornamen bersama.
- Cache key stylesheet diperbarui ke `20261116az`.

## Pemeriksaan
- `node --check server.js`: lulus.
- `npm run check`: lulus.
- `node --test tests/creative-studio-layout.test.js tests/creative-studio-page.test.js`: 5/5 lulus.
- `node --test tests/*.test.js`: 248 lulus, 47 gagal. Kegagalan berada di pemeriksaan lain yang sudah ada/baseline; tes Creative Studio yang relevan lulus.
- Chromium headless pada lingkungan ini tidak menyelesaikan proses screenshot, sehingga tidak diklaim sebagai verifikasi visual otomatis.
