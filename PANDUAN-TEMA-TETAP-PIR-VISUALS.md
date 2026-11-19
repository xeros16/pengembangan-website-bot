# PIR Visuals — Tema Permanen (14 November 2026)

## Yang berubah

- Pilihan Light/Dark di navbar dihapus dari semua halaman yang memakai shell PIR Visuals.
- Pengaturan browser atau preferensi lama `pir_visuals_theme=dark` tidak lagi mengubah desain; markup dipatok ke palet editorial terang dan hero hijau hutan.
- Tema yang digunakan mengambil struktur beranda sebelumnya: hero & navbar forest green (#20372A), latar krem (#F0F3EB), section sage (#C7DAAF), footer forest green.
- Navbar memiliki lebar penuh dan sudut bawah membulat konsisten untuk semua halaman.
- Tautan, FAQ, statistik, dan bagian ajakan bergabung memakai teks berkontras jelas.

## Cara mengganti versi sebelumnya

1. Cadangkan direktori website dan data yang sudah ada. Hentikan server Node.
2. Ekstrak **kedua ZIP** ke direktori proyek yang sama. Timpa file lama pada folder `portfolio-website`.
3. Jalankan `npm ci --include=optional` di folder `portfolio-website` (Node.js 20+). Jangan menyalin `node_modules` antar-OS.
4. Konfigurasikan `.env` produksi/staging dan MongoDB sesuai dokumen `COMPANY-LAUNCH.md`. Jangan meletakkan kata sandi di source.
5. Jalankan server dengan `npm start` (atau metode deployment yang sudah digunakan).
6. Muat ulang tab dengan Ctrl+Shift+R. Dalam DevTools > Network periksa `pir-permanent-theme.css?v=20261114g` berhasil dengan status 200. `pir-unified-theme.css?v=20261114f` **tidak lagi dimuat**.
7. Pastikan navbar tidak memiliki tombol Gelap/Terang dan halaman `/`, `/discover`, `/about`, `/for-business`, `/contact` menggunakan palet yang sama.

## Batas pengujian

Paket ini merupakan revisi tampilan. Pengujian visual dilakukan di browser dengan mock data; integrasi langsung ke MongoDB, email, login, unggah file, dan alur produksi memerlukan staging yang dikonfigurasi dengan aman.

## Catatan

`pir-unified-theme.css` masih disertakan sebagai referensi kompatibilitas file lama tetapi tidak lagi ditautkan oleh website. Gunakan `pir-permanent-theme.css` sebagai sistem akhir yang mengatur tampilan.
