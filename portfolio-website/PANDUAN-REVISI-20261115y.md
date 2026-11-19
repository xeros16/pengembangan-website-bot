# PIR Visuals — Revisi Animasi & Alignment (20261115y)

## Apa yang diperbaiki

1. **Explore di kartu Kategori**: animasi garis bawah halus ditambahkan ketika kartu disentuh kursor, dengan panah yang bergeser sedikit ke kanan-atas. Warna kartu tetap mengikuti desain aslinya.
2. **Kilau kartu Beranda**: kilau dibatasi dengan `overflow: clip` dan `contain: paint` di masing-masing kartu, sehingga tidak terlihat melintasi kartu lain. Efek party paper tetap menggunakan lapisan terpisah di belakang kartu.
3. **Langkah 01–03 di Beranda**: ketiga baris menggunakan grid vertikal dan tinggi minimum yang sama, dengan teks/angka terpusat di antara garis pembatas.
4. **Tombol Temukan desainer**: saat hover tombol sedikit naik dan bayangannya menguat, konsisten dengan tombol interaktif lain.
5. **Hubungi kami dan tautan sejenis**: panah `↗` bergerak saat tautan disentuh, tanpa menggeser teks tautan. Tautan dengan panah teks akan diberi span dekoratif secara otomatis. Pengguna keyboard dapat memakai fokus.
6. **Aksesibilitas**: animasi dihentikan jika browser menggunakan reduced motion atau animasi website dimatikan.

## Cara memasang (dua ZIP dengan folder lengkap)

1. Cadangkan folder `portfolio-website` aktif dan berkas `.env` jika ada.
2. Ekstrak **Part 1** dan **Part 2** ke **lokasi induk yang sama**. Kedua ZIP berisi struktur `portfolio-website/` yang akan tergabung.
3. Jangan menimpa `.env` asli dengan contoh `.env.example`.
4. Masuk ke `portfolio-website` dan jalankan `npm ci --include=optional` bila dependensi belum tersedia, lalu jalankan `npm start`.
5. Restart Node.js, lakukan **Ctrl + Shift + R** di browser.
6. Pastikan browser memuat `/pir-party-paper.css?v=20261115y` dan `/pir-party-paper.js?v=20261115y`.

## Checklist visual

- Beranda: lihat tiga baris langkah 01/02/03; jaraknya harus seragam.
- Beranda: hover 4 kartu satu per satu; kilau hanya di kartu yang disentuh, konfeti tetap di belakang.
- Kategori: hover kartu Brand Identity/UI/UX; Explore menampilkan garis bawah & panah bergerak.
- Beranda: hover tombol **Temukan desainer** dan tautan **Saya seorang desainer**.
- Footer: hover **Hubungi kami**; hanya panah bergerak.
- Uji keyboard (Tab) dan reduced motion bila perlu.

Status: **revisi antarmuka untuk staging**. Integrasi dengan database produksi, pembayaran, dan koneksi eksternal tidak termasuk dalam pengujian khusus revisi ini.
