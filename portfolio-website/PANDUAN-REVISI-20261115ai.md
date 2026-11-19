# Panduan Revisi 20261115ai

## Fokus revisi

1. Menghapus garis / ruang transisi yang masih muncul di antara hero Discover dan area konten di bawahnya.
2. Memindahkan dekorasi kanan pada hero Discover agar posisinya lebih ke tengah, bukan terlalu atas.
3. Membuat panel **Cari talenta** punya warna yang berbeda dari latarnya agar struktur visual lebih jelas.
4. Menerapkan pola **full kanan–kiri** dan ritme jarak atas–bawah yang lebih seragam pada menu publik lain.

## File utama yang diubah

- `pir-public-polish.css`
  - Menghapus jarak bawah hero Discover.
  - Menyetel ulang posisi dekorasi kanan pada hero.
  - Mempertegas perbedaan warna antara latar section dan panel isi.
  - Menambahkan sistem band full-bleed untuk halaman kategori dan company/editorial.
  - Menambahkan latar full-bleed berbasis pseudo-element untuk beberapa section publik lain tanpa mengubah struktur grid aslinya.

## Pemasangan

1. Cadangkan folder proyek lama.
2. Ekstrak ZIP revisi ke folder induk yang sama.
3. Restart Node.js.
4. Hard refresh browser dengan `Ctrl + Shift + R`.

## Hal yang perlu dicek setelah pemasangan

- `/discover`
  - tidak ada strip / ruang kosong di antara hero dan konten
  - dekorasi kanan turun ke area tengah
  - panel **Cari talenta** punya warna yang beda dari latar section
- halaman publik lain
  - area konten utama lebih terasa full kanan–kiri
  - jarak atas dan bawah section lebih seimbang sebelum footer
