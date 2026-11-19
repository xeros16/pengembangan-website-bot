# Patch UX Navigasi untuk Anggota Baru

Patch ini membuat penggunaan bot lebih mudah dipelajari tanpa menghapus perintah lama.

## Perintah untuk pengguna

- `.menu` — beranda dengan kategori berdasarkan kebutuhan.
- `.mulai` — panduan langkah demi langkah untuk anggota baru.
- `.help contrast` — menjelaskan tujuan, format, dan contoh perintah.
- `.menu warna` — palet warna dan pemeriksaan kontras.
- `.menu gambar` — alur informasi gambar, resize, kompres, dan stiker.
- `.menu tools` — alat ide dan perencanaan desain.
- `.menu aset` — mencari aset desain.
- `.menu akun` — peran dan status langganan.
- `.menu premium` — fitur pelanggan dan cara mengetahui statusnya.
- `.menu market`, `.menu grup`, `.menu game`, `.menu owner` — kategori yang sudah ada.

Alias praktis: `.bantuan`, `.panduan`, `.tools`, dan `.akun`.

## Perubahan teknis

- Menu utama menjelaskan langkah pertama dan memberi contoh yang langsung bisa dicoba.
- `.help <perintah>` memberi penjelasan untuk perintah yang umum dipakai, atau mengambil deskripsi dari katalog perintah.
- Menu kategori baru: `mulai`, `warna`, `gambar`, `aset`, `akun`, `premium`.
- Perintah tidak dikenal sekarang membalas dengan jalan kembali ke menu.
- Prefix khusus dari konfigurasi tetap digunakan di navigasi dan bantuan.
- Menambahkan tes navigasi, panduan perintah, prefix, dan fallback topik yang tidak dikenal.

## Pemasangan

1. Matikan bot.
2. Ekstrak ZIP ke folder proyek dan timpa file yang sama.
3. Jangan timpa `.env`, folder autentikasi WhatsApp, database, atau data lokal.
4. Jalankan `npm test` dan `npm run check`.
5. Nyalakan bot dan uji `.menu`, `.mulai`, `.help contrast`, `.menu gambar`, dan `.menu akun`.

Patch ini tidak menambahkan tombol interaktif WhatsApp; navigasi menggunakan pesan teks agar kompatibel dengan implementasi saat ini.
