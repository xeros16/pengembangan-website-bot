# Revisi Jarak Favorit dan Shortlist — 2026-11-16av

## Perubahan
- Menyamakan ruang vertikal di atas dan di bawah band hasil pada `/favorites` dan `/shortlist`.
- Menghapus `margin-bottom` bawaan hero pada halaman Favorit agar tidak ada jarak ekstra yang hanya menambah ruang di sisi atas.
- Menggunakan satu custom property `--pv-empty-band-space` untuk `padding-top` dan `padding-bottom` kedua band.
- Menjaga jarak mobile lebih ringkas dengan nilai responsif yang sama untuk kedua halaman.
- Tidak mengubah ukuran kartu, tipografi, warna, ornamen, atau perilaku penyimpanan favorit/shortlist.
- Memperbarui cache-busting stylesheet menjadi `20261116av`.

## Pemeriksaan
- `npm run check` berhasil.
- Tes regresi jarak Favorit/Shortlist dan tes keseimbangan ornamen Shortlist dijalankan secara terarah.
