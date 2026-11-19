# PIR VISUALS — Revisi Tema Terpadu / 14 November 2026 (f)

**Status:** siap diuji di staging untuk tampilan dan responsivitas; BELUM dinyatakan aman untuk deployment produksi karena integrasi MongoDB, SMTP, login, upload dan alur transaksi belum diuji end-to-end dengan layanan nyata.

## Perubahan

- Menyatukan navbar seluruh halaman: penuh selebar viewport, **sudut bawah membulat 16px desktop / 14px mobile**, tinggi dan jarak konsisten, tombol Portal Desainer terlihat sama dalam dua tema.
- Tema beranda sekarang benar-benar menggunakan **light mode** (ivory/sage, tulisan hijau tua) dan **dark mode** (forest green, tulisan terang), konsisten dengan direktori, Tentang, dan halaman perusahaan.
- Kartu kategori, section talenta, daftar langkah 01–03, FAQ, CTA footer, dan desain halaman internal menggunakan palet PIR Visuals yang sama, dengan typography editorial Georgia untuk heading dan sans-serif untuk isi.
- Sistem tema baru berada di `portfolio-website/pir-unified-theme.css`, di-load **setelah** stylesheet lama pada semua halaman, lewat `server.js` dengan URL versi `?v=20261114f`.
- Konten dan fungsi platform tetap berdasarkan proyek yang Anda unggah; tidak menyalin materi atau logo Bettr Academy. Referensi dipakai hanya untuk pendekatan editorial dan hierarki layout.

## Pemasangan (Windows)

1. **Hentikan server yang berjalan** (`Ctrl+C`) dan backup folder proyek serta `.env` lama.
2. Download kedua ZIP Part 1 dan Part 2. **Ekstrak ke folder yang SAMA**, lalu pindahkan/replace folder `portfolio-website` dari hasil ekstraksi ke proyek Anda. Jangan membuat `portfolio-website/portfolio-website` yang bersarang. Semua file dari dua ZIP wajib digabung, bukan hanya satu bagian.
3. Jangan mengganti `.env` perusahaan; ZIP hanya berisi `.env.example`, tanpa kunci rahasia.
4. Jalankan terminal dari folder `portfolio-website`, lalu `npm ci --include=optional` (agar `sharp` dipasang sesuai sistem Windows Anda).
5. Jalankan `npm start` dengan variabel lingkungan MongoDB dan konfigurasi situs yang benar (atau gunakan perintah start proyek Anda sebelumnya).
6. Buka `http://localhost:3080/`, lakukan `Ctrl + Shift + R`. Bila masih tampil desain lama: DevTools > Network > CSS: **pastikan `pir-unified-theme.css?v=20261114f` ada dan status 200/304**. Jika 404, server masih menunjuk ke folder lama; jika tidak terunduh, tutup proses Node lama dan pastikan yang baru menjalankan file `server.js` yang diperbarui. Bila perlu nonaktifkan/hapus cache service worker untuk localhost di browser pengujian.
7. Uji beranda (`/`), Jelajahi (`/discover`), Tentang (`/about`), Untuk Bisnis (`/for-business`), Kontak (`/contact`), Kategori dan Cara Kerja dalam **mode terang dan gelap**, pada desktop dan ponsel.

## Verifikasi

- Pemeriksaan Chromium terhadap HTML dari server uji + CSS aktual dengan data desainer mock-kosong: **56 dari 56 skenario** (7 rute × 2 tema × 4 lebar: 390, 768, 1365, 1920 px) lulus untuk lebar navbar, sudut nav, overflow horizontal dan kontras FAQ.
- Tautan CSS `pir-unified-theme.css?v=20261114f` HTTP 200 di server uji lokal dengan `Cache-Control: no-cache, must-revalidate`.
- `npm run check` lulus. `npm test`: **424/441 tes lulus**, 17 gagal karena pemeriksaan metadata versi rilis lama dari proyek induk (baseline yang sama), tanpa kegagalan UI baru.
- Regresi tema baru: 4/4 tes lulus. Pengujian interaksi produksi dengan database, autentikasi nyata, surat elektronik, WhatsApp, dan upload gambar **belum dilakukan**.

**Penting:** jangan menganggap website siap untuk publik sampai staging dengan database nyata dan semua jalur akses berhasil diuji serta dokumentasi hukum disetujui.
