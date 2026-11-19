# Perbaikan Footer Full-Bleed PIR Visuals — 2026-11-16ax

## Temuan
- Pada halaman Tentang, konten editorial sudah memiliki bidang latar yang melebar, tetapi footer masih dapat mengikuti lebar wrapper konten yang dibatasi.
- Aturan footer sebelumnya memakai offset gutter lama. Setelah shell About diubah menjadi full-width, offset tersebut tidak lagi konsisten dengan titik tengah viewport.
- Cache-busting stylesheet publik belum berubah sejak revisi sebelumnya, sehingga browser dapat terus memakai salinan CSS lama.

## Perbaikan
- Menambahkan override final pada `pir-public-polish.css` agar footer halaman internal selalu memakai `100vw`, tanpa batas `max-width`, dan tetap berada di tengah viewport dengan `margin-inline: calc(50% - 50vw)`.
- Membatasi override pada halaman internal agar footer Beranda tetap memakai layout khususnya.
- Memperbarui cache-busting menjadi `20261116ax`.
- Menaikkan versi paket website menjadi `3.50.1`.
- Menambahkan tes regresi untuk lebar footer, posisi full-bleed, cakupan halaman, dan cache-busting.

## Dampak
- Footer Tentang dan halaman internal lain kembali membentang dari sisi kiri ke kanan viewport.
- Konten footer tetap mengikuti grid internal yang sudah ada; hanya bidang footer luarnya yang diperluas.
- Tidak mengubah isi, navigasi, warna, tipografi, animasi, maupun data website.
