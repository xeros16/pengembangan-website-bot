# PIR VISUALS — Revisi UI Terverifikasi (14 November 2026)

**Status:** paket source untuk pengujian/staging, belum sertifikasi layak produksi. Dibangun berdasarkan proyek PIR Visuals yang diberikan, bukan salinan Bettr Academy.

## Apa yang sudah diperbaiki

- Kontras tautan **Jelajahi semua desainer** di sisi kanan bagian talenta dan tautan **Jelajahi direktori** dalam empty-state; terlihat di kedua mode.
- Nomor **01 / 02 / 03** serta deskripsi langkah pada bagian manifesto menggunakan tinta hijau gelap yang konsisten dengan background sage di kedua mode.
- Bagian **Questions, answered.**: judul pertanyaan Georgia, jawaban font sans Inter/fallback, kartu FAQ rapi, jarak dan kontras konsisten untuk mode terang/gelap.
- Bagian footer **Temukan talenta. Wujudkan ide besar.** kini berada dalam satu bingkai responsif, dengan jarak tombol teratur.
- Navbar beranda dan halaman lain memiliki tinggi dan lebar yang sama sesuai ukuran layar, termasuk pada mobile.
- `company-editorial.css` sekarang memakai URL versi baru `?v=20261114e`. Endpoint stylesheet memakai `Cache-Control: no-cache, must-revalidate` dan membaca ulang konten tanpa perlu restart lagi setelah deployment versi ini.

## Mengganti proyek lama di Windows (penting)

1. **Matikan proses website yang sedang berjalan** di terminal Node.js (`Ctrl+C`). Jika membuka ulang terminal baru tidak mengubah tampilan, pastikan tidak ada proses Node lama yang masih memakai port 3080.
2. Buat backup folder proyek yang lama. **Unduh dan ekstrak ZIP Part 1 serta Part 2 di folder induk yang sama** sehingga keduanya menyatu, lalu timpa file proyek lama dengan nama dan struktur yang sama (`portfolio-website/`). Jangan membuat folder bersarang seperti `portfolio-website/portfolio-website/`.
3. Di terminal, dari folder `portfolio-website`, jalankan `npm ci --include=optional` untuk memasang dependensi **khusus Windows atau OS yang sedang digunakan**. Paket ini sengaja tidak menyertakan `node_modules`/DLL Windows agar tidak menimpa dependensi lama yang salah platform.
4. Pastikan file `.env` lama dan koneksi MongoDB **tetap disimpan secara privat di folder induk proyek**, karena tidak disertakan dalam ZIP. Tidak perlu mengganti password atau data perusahaan hanya untuk revisi CSS.
5. Jalankan ulang website dengan perintah startup proyek sebelumnya (misalnya `npm run website` dari root jika tersedia, atau `npm start` dari `portfolio-website` dengan `MONGO_URI` yang sudah benar).
6. Buka `http://localhost:3080/` lalu lakukan **Ctrl+Shift+R** (hard refresh). Di Chrome DevTools > Network, cari `company-editorial.css?v=20261114e` dan pastikan status 200 atau 304 dan file-nya memuat `2026-11-14e`. Jika masih memakai `?v=20261114c`, berarti browser terhubung ke proses/server dari folder kode lama; perbaikan baru belum sedang dijalankan.
7. Uji **beranda**, `/about`, `/discover`, dan **mode Gelap/Terang**. Pastikan tidak ada tautan yang hilang kontras.

## Pemeriksaan yang dilakukan

- Chromium (HTML dari server uji, data MongoDB dimock kosong): 5 rute publik × 2 tema × 4 ukuran layar (390, 768, 1365, 1920) = **40/40 skenario** lulus untuk lebar navbar, overflow, kontras elemen sasaran, font FAQ, CTA footer. Native FAQ `<details>` dibuka dan menu mobile diuji pada simulasi DOM.
- `npm run check`: lulus.
- `npm test`: **420/437** lulus; 17 gagal karena pemeriksaan metadata versi lama dari baseline, belum terselesaikan. Tes khusus cache CSS yang berubah selama proses berjalan lulus.
- Header stylesheet uji: `Cache-Control: no-cache, must-revalidate` dan ETag berubah ketika isi berubah.

## Keterbatasan

Database MongoDB nyata, login akun, SMTP, upload gambar, cache service worker yang pernah tersimpan di browser pengguna, serta deployment produksi belum diuji end-to-end. Jangan menganggap paket ini otomatis aman dipublikasikan. Pelihara konfigurasi rahasia perusahaan, uji jalur kerja dengan data staging, dan finalisasi kebijakan hukum sebelum live.
