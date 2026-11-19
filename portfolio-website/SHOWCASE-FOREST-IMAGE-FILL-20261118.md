# PIR Visuals — Forest Panel and Artwork Fill

Tanggal: 18 November 2026

## Perubahan
- Kolom kiri dan kanan carousel desktop dipertahankan 50:50, sehingga ruang teks dan ukuran tipografi tidak berubah menjadi sempit.
- Latar hijau tua mengisi seluruh kolom media di sisi kanan, dengan warna forest PIR.
- Gambar/video diperbesar hingga batas maksimum area hijau menggunakan `object-fit: contain`; rasio asli tetap terjaga, tidak terpotong, dan tidak tertarik.
- Tidak ada kanvas putih, border, shadow, atau dekorasi lingkaran tambahan dari CSS di sekitar media.
- Pada tablet/mobile, layout tetap bertumpuk: teks di atas, media di bawah. Latar hijau mengisi lebar area media, sedangkan tinggi gambar mengikuti rasio asli dan dibatasi secara responsif agar tidak melampaui viewport.

## Catatan
Area putih yang memang merupakan bagian dari file karya yang diunggah tetap dipertahankan. CSS hanya menghilangkan latar putih buatan dari elemen website; file karya asli tidak dimodifikasi.
