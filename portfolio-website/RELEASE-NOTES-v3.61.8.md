# PIR Visuals — Release Notes v3.61.8

Tanggal: 18 November 2026

## Carousel full-bleed + scrollbar-safe centering
- Mengembalikan panel carousel ke lebar penuh dari tepi kiri sampai tepi kanan layar.
- Lebar carousel dihitung dari `document.documentElement.clientWidth`, sehingga scrollbar desktop tidak ikut dihitung sebagai area gambar.
- Offset kiri dihitung dari posisi aktual section showcase, bukan mengandalkan `100vw` saja.
- Rail kontrol mengikuti lebar penuh yang sama.
- Ukuran gambar, `object-fit: contain`, rasio asli, posisi vertikal, teks kiri, dan layout responsif tetap dipertahankan.

## Validasi
- Pemeriksaan sintaks JavaScript: lulus.
- Tes regresi showcase: lulus.
