# Catatan Perbaikan PIR Visuals Website v3.57.0

## Perbaikan yang diterapkan
1. **Foto profil Quick View** — modal Jelajahi kini menerima avatar lokal `/profile-avatar/DSN-...` maupun URL HTTPS. Jika sumber foto gagal dimuat, inisial nama desainer ditampilkan sebagai fallback.
2. **Selected Work pada halaman profil** — dua gambar pertama dimuat dengan prioritas lebih tinggi; gambar lainnya tetap lazy-load. Gambar ditampilkan dengan `width: 100%` dan `height: auto` agar rasio asli terjaga.
3. **Cover studi kasus** — efek scale/parallax yang memperbesar gambar dihilangkan. Gambar menggunakan `object-fit: contain`, tinggi otomatis, dan caption terpisah sehingga tepi desain tidak terpotong.
4. **Navigasi studi kasus** — warna teks, ukuran, padding, jarak, dan latar diperjelas agar label mudah dibaca serta tidak menempel pada gambar.
5. **Formulir pengalaman proyek** — field Nama, Email, Proyek, Rating, dan Ulasan disusun dalam dua kolom pada desktop dan satu kolom pada layar kecil. Semua input memenuhi lebar kolom; textarea dan tombol memiliki jarak yang jelas.

## Pemeriksaan setelah pemasangan
- Buka `/discover`, klik **Quick view**, pastikan foto profil muncul.
- Buka `/designer/ID-DESAINER`, periksa gambar Selected Work; gambar harus terlihat penuh sesuai rasio aslinya.
- Buka `/work/ID-KARYA`, pastikan cover tidak terpotong dan navigasi bab terbaca.
- Periksa bagian **Bagikan pengalaman proyek** pada desktop dan mobile.
