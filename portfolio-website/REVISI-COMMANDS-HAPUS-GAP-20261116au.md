# Revisi Menu Commands — 2026-11-16au

## Perubahan
- Menghapus jarak kosong antara bagian bawah hero hijau tua dan band pencarian/kategori pada `/commands`.
- Penyebabnya adalah `margin-bottom` global untuk hero halaman internal yang lebih spesifik daripada aturan Command Explorer sebelumnya.
- Menambahkan override khusus dengan spesifisitas lebih tinggi untuk `.command-explorer-hero`, tanpa mengubah ukuran kartu, dekorasi, atau komposisi filter.
- Memperbarui versi cache `pir-public-polish.css` menjadi `20261116au`.

## Pemeriksaan
- `npm run check` berhasil.
- Suite `npm test` masih memiliki kegagalan lama yang tidak terkait revisi jarak ini, termasuk test intro, cache-version yang mengunci versi sebelumnya, dan referensi modul `features/command-catalog.js` di luar folder proyek.
