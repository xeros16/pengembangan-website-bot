# PIR Visuals — Gerak & Scrolling Halus (2026-11-14k)

## Perubahan
- Animasi FAQ sekarang menggunakan ukuran aktual panel yang sedang terlihat untuk melanjutkan gerakan saat diklik ulang. Pembukaan/penutupan memakai easing lembut (260–430 ms), tanpa menghilangkan elemen `<details>` native.
- Scrolling roda mouse bertahap pada desktop memakai interpolasi berdasarkan waktu (~115 ms). Trackpad berpresisi tinggi, layar sentuh, keyboard, isi modal, dan area scroll tersarang tetap menggunakan mekanisme asli browser.
- Tautan antarbagian dalam satu halaman menggunakan scroll halus dengan offset untuk navbar sticky.
- Pengguna yang memilih `prefers-reduced-motion: reduce` atau opsi animasi **Nonaktif** mendapatkan interaksi instan.
- Tidak ada pustaka eksternal baru, perubahan identitas warna, atau penambahan mode terang/gelap.

## Instalasi dua ZIP
1. Buat cadangan folder proyek `portfolio-website` dan simpan `.env` asli di luar berkas distribusi.
2. Ekstrak Part 1 dan Part 2 ke folder induk **yang sama** sehingga file bertemu dalam folder `portfolio-website`.
3. Jangan menghapus `node_modules`, aset upload, atau `.env` yang sudah ada. Bila dependensi tidak tersedia, jalankan `npm ci --include=optional` dari folder website.
4. Restart proses Node.js yang menjalankan website.
5. Di browser tekan Ctrl+Shift+R. Periksa Network: `/pir-faq-accordion.js?v=20261114k`, `/pir-scroll-experience.js?v=20261114k`, dan `/pir-motion-refinement.css?v=20261114k` harus menerima HTTP 200.

## Cara mengecek
- Buka halaman beranda dan bagian **Questions, answered.** Klik pertanyaan, klik lagi ketika animasi belum selesai, lalu tekan Enter ketika judul FAQ difokuskan. Tidak boleh meloncat atau macet.
- Gunakan roda mouse 1–3 langkah untuk melihat pengereman halus; jika memakai touchpad, perilaku tetap native demi ketepatan gesture.
- Coba zoom 100%, 75%, 50%; tombol animasi `On` tetap seperti sebelumnya. Bila animasi dinonaktifkan atau pengaturan sistem mengurangi motion, FAQ membuka/menutup langsung.
- Periksa tidak ada horizontal overflow di halaman mobile.

## Keterbatasan verifikasi
- Chromium headless memverifikasi HTML/CSS/JavaScript yang diambil dari server uji dan disatukan menjadi pratinjau lokal karena navigasi Chromium ke localhost dibatasi pada lingkungan pengujian ini. Diuji pada lebar 390, 768, 1365, dan 1920px; juga pengaturan reduced-motion. Tidak ada error halaman atau horizontal overflow dalam skenario tersebut.
- Tes baru + regresi terkait: **6/6 lulus**. Total website `node --test tests/*.test.js`: **149/172 lulus**, **23 gagal** (jumlah kegagalan sama dengan baseline paket sebelumnya, sebagian memeriksa kontrak/struktur lama). Integrasi backend produksi dengan database nyata tidak dicakup dalam rilis ini.
- Referensi Bettr Academy digunakan sebagai inspirasi nuansa interaksi editorial, bukan klaim reproduksi yang identik atas mesin scroll situs tersebut.
