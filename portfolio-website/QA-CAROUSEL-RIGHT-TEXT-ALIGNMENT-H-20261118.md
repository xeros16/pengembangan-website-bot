# QA Carousel Right Text Alignment H — 18 November 2026

## Scope
- Menghapus offset 100 px yang membuat harga dan tautan Profil kreator melewati batas kolom kiri.
- Mengembalikan kedua elemen ke tepi konten aktual pada panel teks.
- Mengembalikan ujung garis putus-putus ke tepi yang sama.
- Tidak mengubah judul, deskripsi, tombol, gambar, rasio gambar, atau layout mobile.

## Hasil
- `npm run check`: lulus.
- 15 pengujian regresi carousel terkait padding, alignment, runtime, mobile, dan gambar: lulus.
- Pemeriksaan seluruh suite proyek tidak digunakan sebagai kriteria rilis karena terdapat kegagalan pada pengujian lama yang tidak terkait dengan revisi carousel ini.
