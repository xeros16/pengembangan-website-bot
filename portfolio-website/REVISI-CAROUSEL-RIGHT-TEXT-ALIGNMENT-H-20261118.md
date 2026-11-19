# Revisi Carousel — Right Text Alignment H (18 November 2026)

## Perubahan
- Membatalkan offset horizontal 100 px yang membuat harga dan tautan Profil kreator terdorong melewati batas kolom kiri.
- Harga dan Profil kreator sekarang mengikuti tepi konten aktual pada panel teks, sejajar dengan ujung garis putus-putus.
- Ujung garis putus-putus dikembalikan ke tepi konten yang sama (`right: 0`).
- Judul, deskripsi, tombol CTA, kolom gambar, rasio gambar, dan layout mobile tidak diubah.
- Runtime membersihkan inline offset lama dan cache key dinaikkan ke `20261118-copy-inset-runtime-h`.

## Validasi
- Pemeriksaan sintaks JavaScript.
- Pengujian regresi khusus alignment desktop, runtime, dan perilaku mobile.
