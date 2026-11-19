# Laporan QA — Homepage Media & Profile Save (2026-11-17)

## Cakupan
- Preview foto profil lokal dengan fallback preview server.
- Penyimpanan profil melalui fetch/FormData, redirect setelah sukses, pesan error dan timeout.
- Upload media banner Beranda independen untuk foto dan video.
- Penghapusan/penggantian file media lama dengan validasi format dan batas ukuran.
- Streaming video menggunakan HTTP byte ranges.
- Rasio gambar asli pada banner, preview portofolio, dan tampilan mobile.

## Hasil otomatis
- `npm run check`: lulus, 329 file JavaScript.
- `npm run website:check`: lulus.
- Targeted tests: 20/20 lulus.
- Root `npm test`: 689 total, 683 lulus, 6 gagal. Nama tes yang gagal sama dengan baseline v6.7.7; tidak ada kegagalan baru.
- Website `npm test`: 610 total, 546 lulus, 64 gagal. Nama tes yang gagal sama dengan baseline v6.7.7; tidak ada kegagalan baru.

## Batas pengujian
Browser langsung, MongoDB, dan proses upload dengan Sharp belum dapat dijalankan di lingkungan build ini. Setelah deployment, lakukan uji unggah satu PNG profil, satu gambar banner landscape, satu video MP4/WebM, lalu verifikasi halaman Beranda desktop dan mobile serta status simpan profil.
