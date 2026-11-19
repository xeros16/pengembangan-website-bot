# PIR Visuals — Revisi FAQ, Manifesto, dan Tombol (20261115z)

## Penyebab masalah

1. `pir-footer-refinement.css` memberi padding kiri/kanan **langsung** pada `<p>` jawaban FAQ. Ketika `pir-party-paper.css` mengatur padding pada `.pv-faq-panel`, kedua padding bertumpuk. Perubahan pada wadah saja tidak dapat menghilangkan offset tersebut.
2. Manifesto 01–03 memiliki aturan grid/padding/tinggi baris dari beberapa versi CSS. Pembaruan ini menggunakan ukuran baris akhir yang konsisten (54 px) dan penyesuaian optis 2 px untuk baris 01 dan 02.
3. Tombol footer **Temukan desainer** (`.pv-footer-button`) tidak ada di `magneticSelector` global, sehingga animasi magnetiknya tidak pernah dipasang oleh JavaScript utama. Tombol di hero sudah termasuk kelas `.pv-button`.

## Perubahan

- Menghapus padding horizontal pada `details p` dari stylesheet sumber konflik.
- Menerapkan gutter horizontal yang identik pada teks judul pertanyaan dan jawaban, termasuk mobile.
- Mengatur baris 01–03 setinggi minimum 54 px dengan satu garis pemisah. Baris 01 dan 02 mendapat penyesuaian optis 2 px ke bawah.
- Menambahkan `.pv-footer-button` ke handler magnetik yang **sudah ada**, bukan menambahkan pengendali pointer baru.
- Menaikkan versi stylesheet ke `20261115z` untuk mencegah pemuatan cache lama.

## Pemasangan

1. Buat backup folder proyek, terutama file `.env`.
2. Ekstrak ZIP Part 1 dan Part 2 **ke folder induk yang sama** sehingga keduanya bergabung sebagai `portfolio-website/`.
3. Jika dependensi belum ada, jalankan `npm ci --include=optional` di folder tersebut.
4. Restart Node.js (`npm start`) dan lakukan **Ctrl + Shift + R** di Chrome.
5. Periksa `pir-party-paper.css?v=20261115z` dan `pir-footer-refinement.css?v=20261115z` di tab Network.

## Yang perlu dilihat setelah memasang

- Semua jawaban FAQ sejajar tepat di bawah awal teks pertanyaan, tidak memiliki indent tambahan.
- Baris manifesto 01, 02, dan 03 lebih rapat dan rata secara optis.
- Tombol **Temukan desainer** pada bagian bawah dapat mengikuti gerakan mouse sama seperti tombol hero.

Ini adalah perbaikan UI yang diuji di lingkungan Chromium tanpa integrasi database produksi.
