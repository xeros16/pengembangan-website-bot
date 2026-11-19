# Revisi Halaman Tentang — Full Bleed dan Hapus Gap Atas

## Perubahan
- Menghapus padding atas wrapper editorial pada halaman `/about` (serta `/how-it-works` yang memakai struktur hero sama), sehingga hero langsung menyambung ke navbar tanpa bidang kosong di antaranya.
- Membuat bidang latar hero sage membentang dari tepi kiri hingga tepi kanan viewport, termasuk saat viewport melebar karena zoom browser.
- Mempertahankan jarak horizontal konten hero agar judul dan panel sisi tetap nyaman dibaca.
- Mempertahankan lebar terukur dan posisi terpusat untuk kartu, bagian penjelasan, serta CTA di bawah hero.
- Menambahkan penyesuaian mobile tanpa mengubah desain konten.
- Memperbarui cache-busting `pir-public-polish.css` menjadi `20261116aw`.

## Berkas yang diubah
- `pir-public-polish.css`
- `server.js`
