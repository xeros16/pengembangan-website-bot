PIR VISUALS — CAROUSEL INNER EQUAL PADDING
Tanggal: 18 November 2026

Perubahan:
- Konten teks setiap slide carousel kini dibungkus dalam .pv-showcase-copy-inner.
- Pada desktop (>900px), wrapper memiliki lebar 100% dikurangi 70px dan margin kiri/kanan auto.
- Hasilnya, jarak kiri dan kanan dari tepi panel teks sama-sama 35px.
- Padding vertikal panel tetap 46px atas dan 42px bawah.
- Pada tablet/mobile, wrapper kembali menggunakan lebar penuh di dalam padding responsif yang sudah ada.
- Elemen gambar, ukuran kolom 50:50 desktop, dan aturan rasio gambar tidak diubah.

Validasi:
- npm run check: lulus.
- 65 pengujian showcase: lulus.
- 4 pengujian struktural khusus padding: lulus.

Pemasangan:
Ekstrak ZIP, timpa folder portfolio-website lama, hentikan server yang sedang berjalan,
jalankan ulang `npm start` dari folder portfolio-website, lalu hard refresh browser dengan Ctrl+Shift+R.
