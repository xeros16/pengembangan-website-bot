# Panduan Revisi 20261115ah

## Fokus revisi

1. Menurunkan posisi dekorasi kanan pada halaman **Jelajahi / Discover** agar sejajar dengan area isi utama, tidak terlalu menempel ke atas.
2. Membuat blok konten setelah hero di halaman Discover menjadi **full kanan–kiri** seperti pola di halaman Shortlist, tetapi tetap menjaga isi berada di tengah dengan lebar baca yang rapi.
3. Menyamakan ruang **atas dan bawah** pada band konten Discover agar jarak ke footer tidak terasa sempit.
4. Menerapkan ritme jarak bawah yang lebih konsisten pada menu publik lain seperti halaman kategori, company/editorial, support, collection, dan command explorer.

## File utama yang diubah

- `server.js`
  - Menambahkan wrapper `pv-discovery-stage` pada halaman `/discover` agar seluruh area setelah hero bisa diperlakukan sebagai satu band penuh.
- `pir-public-polish.css`
  - Menurunkan posisi orbit/dekorasi kanan pada hero Discover.
  - Menambahkan sistem full-bleed untuk `pv-discovery-stage`.
  - Menyamakan padding vertikal atas dan bawah.
  - Menambahkan ritme margin bawah konsisten untuk beberapa halaman publik lain.

## Pemasangan

1. Cadangkan folder proyek lama.
2. Ekstrak ZIP revisi ke folder induk yang sama.
3. Restart Node.js.
4. Hard refresh browser dengan `Ctrl + Shift + R`.

## Area yang perlu dicek setelah pemasangan

- `/discover`
  - posisi dekorasi kanan pada hero
  - band konten setelah hero sudah full kiri–kanan
  - jarak sebelum footer terasa seimbang
- menu lain yang memakai tema publik
  - jarak bawah section terakhir tidak terlalu mepet footer
