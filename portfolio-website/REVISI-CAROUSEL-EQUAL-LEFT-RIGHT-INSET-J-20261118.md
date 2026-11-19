# Revisi Carousel Equal Left/Right Inset J — 2026-11-18

- Memperbaiki akar masalah: override padding sebelumnya kalah oleh selector CSS desktop yang lebih spesifik.
- Menambahkan override desktop dengan spesifisitas lebih tinggi pada elemen kolom teks yang benar (`.pv-showcase-copy[data-pv-showcase-copy]`).
- Padding kiri dipertahankan pada nilai inset aktif; padding kanan sekarang memakai nilai dan rumus clamp yang identik (`clamp(28px, 4.6vw, 74px)`).
- Harga, tautan profil kreator, dan garis pemisah mengikuti batas konten yang sama melalui lebar konten kolom.
- Tidak mengubah kolom gambar kanan maupun breakpoint/tampilan mobile.
