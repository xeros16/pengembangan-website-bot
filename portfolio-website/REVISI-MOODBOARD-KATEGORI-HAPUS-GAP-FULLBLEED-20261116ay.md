# Revisi Moodboard & Kategori — 2026-11-16ay

## Perubahan

### Moodboard (`/collections`)
- Menghilangkan margin bawah bawaan pada hero halaman internal agar stage Moodboard langsung menyambung di bawahnya.
- Menetapkan margin atas builder ke nol.
- Mempertahankan padding internal stage sehingga form dan panel preview tetap memiliki ruang baca.

### Kategori (`/categories`)
- Menghapus padding atas wrapper editorial yang sebelumnya menghasilkan celah di bawah navbar.
- Membuat masthead `Find your creative language` membentang selebar viewport.
- Mempertahankan grid kategori dan bagian karya terbaru pada lebar konten yang nyaman dibaca.

## Cache
- Versi stylesheet dinaikkan ke `20261116ay` agar browser mengambil aturan CSS terbaru.

## Pengujian
- Ditambahkan tes regresi untuk kedua halaman dan cache-busting stylesheet.
