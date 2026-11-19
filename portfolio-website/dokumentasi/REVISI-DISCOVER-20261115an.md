# PIR Visuals — Koreksi posisi dekorasi dan jarak section (AN)

## Masalah yang ditemukan
Sebelumnya dekorasi berbentuk pseudo-element menggunakan `offset-path`. Meskipun memiliki `top:50%`, koordinat lintasan animasi memengaruhi posisi aktual ornamen di Chrome sehingga bergeser ke atas. Aturan padding lama yang berlapis juga membuat bagian Cari talenta sulit diseimbangkan.

## Perubahan
1. Dekorasi kanan halaman `/discover` sekarang berupa elemen DOM terpisah `.pv-discover-ornament`, dengan titik tengah tetap pada 50% tinggi hero; gerakan ringan diterapkan pada lapisan di dalamnya.
2. Pseudo-element dekorasi lama pada halaman `/discover` dinonaktifkan agar tidak bertumpuk dan tidak menarik ornamen kembali ke atas.
3. Bagian pencarian talenta menggunakan pita sage `100vw`; kotak pencarian disejajarkan menggunakan flex dan padding vertikal simetris. Jarak luar antarseksi ditata ulang untuk menghindari ruang kosong berlebih.
4. Mobile menyembunyikan ornamen bila ruang terlalu kecil. Opsi reduced motion tetap dihormati.
5. Cache-busting stylesheet menjadi `pir-public-polish.css?v=20261115an`.

## Validasi
- `npm run check`: lulus.
- `node --test tests/discover-hero-spacing-20261115an.test.js`: 3/3 lulus.
- Chromium via Playwright pada fixture dengan struktur DOM dan stylesheet utama: viewport 1365, 1000, 768, 390 px tanpa overflow horizontal.
- Pada desktop 1365 px, center hero dan center wadah ornamen berada di koordinat Y yang sama (458,55 px). Posisi animasi anak berubah selama pengamatan, bukan macet.
- Pada desktop 1365 px, jarak antara batas atas band dengan kotak pencarian dan antara tepi kotak dengan batas bawah band sama-sama sekitar 71 px.
- Pada mobile 390 px, jarak vertikal band simetris sekitar 39 px.

## Pemasangan
1. Cadangkan folder lama beserta `.env` dan data produksi.
2. Ekstrak ZIP Part 1 ke lokasi folder `portfolio-website` yang digunakan server. ZIP Part 2 opsional untuk dokumentasi.
3. Pastikan proses Node.js dihentikan, kemudian hidupkan lagi (`npm start` atau perintah deployment proyek).
4. Periksa tab Network: `pir-public-polish.css?v=20261115an` harus termuat dengan status 200.
5. Hard refresh (`Ctrl + Shift + R`) dan periksa `/discover` pada zoom 100% dan 75%.

**Batas pemeriksaan:** pengujian visual menggunakan fixture lokal, bukan database MongoDB produksi maupun browser di komputer pengguna.
