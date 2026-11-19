# Revisi Alignment Judul Showcase — 19 November 2026

Memperbaiki penyebab judul masih belum sejajar setelah revisi sebelumnya.

- Sebelum menghitung offset, posisi horizontal judul direset ke posisi layout aslinya.
- Offset dihitung dari posisi dasar tersebut, bukan dari posisi yang sudah digeser oleh hitungan sebelumnya.
- Penyelarasan tetap menggunakan tepi kiri heading karya aktif di carousel.
- Offset tetap dibatasi dalam batas area showcase agar judul tidak keluar layar saat zoom.
- Ukuran teks, panel carousel, artwork, dekorasi ranting, dan layout full-width tidak diubah.

File utama: `pir-home-showcase.js`, `server.js`.
