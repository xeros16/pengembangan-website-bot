# PIR Visuals — Ornamen Kanan Selaras (AR)

## Perubahan
- Menggunakan ulang ornamen logo PIR VISUALS dan lima aksen orbit dari hero **Jelajahi** untuk hero halaman publik lain yang sebelumnya menampilkan logo PIR melalui CSS, terutama **Favorit**, **Shortlist**, dan halaman dengan hero generik bertema forest green.
- Tambahkan aksen orbit serupa pada lingkaran PIR Visuals di footer, tanpa menduplikasi wordmark yang sudah ada.
- Ornamen dipusatkan vertikal di kanan hero dengan `top:50%` dan `translateY(-50%)`, bukan menggunakan margin negatif untuk menyelaraskan posisinya.
- Dekorasi tidak mengubah posisi konten atau menerima klik mouse (`pointer-events:none`).
- Hilangkan logo pseudo lama setelah ornamen baru berhasil terpasang, untuk mencegah logo ganda. Jika JavaScript dinonaktifkan, logo lama tetap bisa tampil.
- Pada layar sempit atau browser zoom besar, ornamen disembunyikan agar teks tidak tertutup. Preferensi reduced motion dan toggle animasi tetap dihormati.
- Tidak mengubah filter Cari talenta, tinggi band, warna tema, atau struktur halaman Jelajahi yang sudah disetujui.

## Penerapan
Ekstrak seluruh ZIP ke folder induk sehingga proyek tetap berada di `portfolio-website/`. Jalankan `npm install` bila dependency belum terpasang dan `npm start` dengan konfigurasi `.env` Anda. Hard refresh Ctrl+Shift+R setelah pembaruan.

## Validasi
- Sintaks `server.js` dan `pir-shared-ornaments.js` dicek dengan `node --check`.
- Fixture DOM simulasi Chromium membuktikan emblem berada tepat pada pusat vertikal hero pada lebar 1365 dan 980 px, muncul pada Shortlist dan hero standar, serta tidak menyebabkan horizontal overflow. Pada lebar 390 px, logo disembunyikan agar tidak menutup judul.
- Visual asli yang terhubung ke database dan semua halaman produksi perlu diperiksa setelah dipasang.
