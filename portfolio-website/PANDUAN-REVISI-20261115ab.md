# PIR Visuals — Ornamen editorial & konsistensi halaman publik (20261115ab)

## Yang diubah

- **Jelajahi / Discover:** emblem PIR Visuals di kanan hero dipindahkan dari pusat 50% ke pusat visual 41%. Efek orbit, titik aksen, dan garis kecil pada label hero ditambahkan dengan kontras rendah agar tidak menutupi teks.
- **Tentang, Cara Kerja, Untuk Bisnis:** latar hero sage, lingkaran tipis, dan motif kecil pada panel hijau memakai pendekatan editorial yang sama.
- **Kategori:** hero sage bertingkat, tekstur lingkaran yang halus, dan indeks kategori memiliki bingkai serta bidang warna yang lebih terstruktur.
- **Shortlist:** aksen halo di hero, panel hasil tetap sage/ivory.
- **Contact/support, Creative Studio, Moodboard, Ruang Klien, dan halaman informasi:** detail visual diselaraskan agar tidak lagi berupa bidang putih polos yang saling tidak cocok.
- **Performa:** ornamen dibuat dengan CSS tanpa animasi scroll, request JavaScript baru, atau elemen yang menangkap klik.

## Berkas yang diperbarui

- `pir-page-harmony.css` — aturan visual terakhir.
- `server.js` — query versi stylesheet `pir-page-harmony.css?v=20261115ab`.
- `tests/page-harmony-20261115ab.test.js` — regresi desain dan pemuatan aset.

## Pemasangan

1. Cadangkan folder proyek aktif dan `.env` yang digunakan.
2. Ekstrak **ZIP Part 1** dan **ZIP Part 2** ke direktori induk yang sama; keduanya menggabungkan folder `portfolio-website/`.
3. Jalankan `npm ci --include=optional` bila dependensi belum terpasang; jangan menimpa `.env` dari sistem produksi.
4. Restart Node.js dengan `npm start`.
5. Hard refresh browser dengan **Ctrl + Shift + R** dan pastikan query CSS `20261115ab` termuat.

## Yang perlu diperiksa di komputer Anda

- Pada desktop: Jelajahi — emblem kanan sekarang seimbang dengan judul, tidak terlalu rendah.
- Pada ponsel: emblem dekoratif disembunyikan agar teks dan statistik tetap terlihat.
- Cek halaman menu **Lainnya**: Tentang, Kategori, Cara Kerja, Shortlist, Moodboard, Creative Studio, serta Contact.
- Gunakan zoom 100% dan 75% untuk memastikan dekorasi tidak mengganggu tombol atau formulir.
