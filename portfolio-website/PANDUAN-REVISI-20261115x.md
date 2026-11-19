# PIR Visuals — Revisi Efek Kartu 20261115x

## Apa yang berubah?

- **Cara Kerja (`/how-it-works`):** animasi party paper sekarang muncul pada tiga kartu “Cari yang tepat”, “Pilih karya favorit”, dan “Bicarakan proyek”.
- **Animasi tambahan selain party paper:** efek cahaya/kilau melintasi permukaan kartu saat hover, kartu terangkat halus, dan judul/tautan bergeser sedikit. Tidak menggunakan scroll listener atau animasi yang berjalan terus-menerus.
- **Cakupan animasi tambahan:** empat kartu kategori di Beranda, kartu di halaman Kategori (`/categories`), tiga kartu Untuk Bisnis (`/for-business`), dan tiga kartu Cara Kerja. Karena strukturnya sama, halaman Tentang juga memperoleh efek yang seragam.
- **Batasan efek:** animasi partikel berlangsung singkat, otomatis dihapus, tidak menghalangi tautan, dan otomatis dinonaktifkan untuk perangkat dengan pengaturan `prefers-reduced-motion`.
- **Paket lengkap:** isi kedua ZIP berada di bawah folder `portfolio-website/` dan saling melengkapi. Paket ini bukan patch file lepas.

## Cara instalasi

1. Cadangkan folder proyek lama dan file `.env` milik Anda.
2. Ekstrak ZIP **Part 1** dan ZIP **Part 2** ke lokasi induk yang sama, sehingga struktur akhirnya menjadi `portfolio-website/`.
3. Jika dependensi belum terpasang, jalankan `npm ci --include=optional` dalam folder `portfolio-website`.
4. Restart server dengan `npm start`.
5. Di Chrome gunakan **Ctrl + Shift + R** supaya versi CSS/JS baru terpakai.
6. Periksa halaman `/`, `/categories`, `/for-business`, dan `/how-it-works`, lalu coba arahkan mouse ke masing-masing kartu.

## File penting

- `pir-party-paper.js`: penggerak efek konfeti pada kelompok kartu.
- `pir-party-paper.css`: sistem warna, konfeti, animasi kilau, dan transisi kartu.
- `server.js`: referensi aset baru dengan versi `20261115x`.

**Catatan:** validasi dilakukan pada interaksi front-end melalui render Chromium tanpa server database nyata. Lakukan pengujian tambahan sebelum deployment produksi.
