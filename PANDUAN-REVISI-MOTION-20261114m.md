# PIR VISUALS — Revisi Scrolling, FAQ, Navbar & Marquee

Tanggal: 14 November 2026 · Versi CSS/JS: `20261114m` · **Staging / UI revision**

## Perubahan yang diterapkan

1. **Scrolling editorial yang lebih lembut:** pergantian dari pengendali roda mouse lama berbasis klasifikasi langkah 80/120 px menjadi pengendali spring critically damped (`pir-scroll-experience.js`). Gerakan tanpa overshoot dan bisa dibatalkan saat pengguna menyentuh, menggunakan scrollbar, atau menekan tombol. Touchpad presisi dan mobile tetap native. Pengalaman ini *diadaptasi*, bukan salinan identik implementasi proprietary Bettr Academy.
2. **FAQ tanpa patah:** `<details>` tetap native untuk aksesibilitas, animasi sekarang ditangani `::details-content` + `interpolate-size` dalam CSS (modern browser). Script FAQ hanya menyinkronkan ARIA; tidak lagi melakukan pengukuran ulang tinggi per klik. Browser lama tetap membuka/menutup secara native tanpa animasi.
3. **Garis hero konsisten:** garis di atas `PORTFOLIO FIRST / DIRECT CONNECTION / BUILT FOR CREATIVES` dan garis di bawahnya memakai lebar konten sama. Animasi masuk panel indeks tidak lagi menggeser sumbu X.
4. **Navbar seragam:** margin bawah 0, tidak ada celah putih di bawah navbar beranda, sudut navbar 0 pada beranda dan halaman internal, tidak ada dekorasi sudut pada navbar.
5. **Marquee tanpa kosong:** tiap kelompok teks diulang sebanyak kebutuhan viewport, satu driver `requestAnimationFrame`, tanpa animasi CSS/GSAP bersaing. Hover menurunkan kecepatan secara bertahap dari sekitar 44px/detik ke 5px/detik, **tidak berhenti**.
6. **Preferensi aksesibilitas:** `prefers-reduced-motion` dan pengaturan Motion=Off mematikan gerakan dekoratif, tidak menghalangi isi atau navigasi.

## Cara instalasi di proyek yang sudah berjalan

- Cadangkan folder proyek dan file `.env`.
- Ekstrak **Part 1** lalu **Part 2** ke lokasi yang sama, sehingga keduanya menggabungkan folder `portfolio-website`.
- Ganti file lama yang namanya sama; jangan hapus folder data operasional atau `.env` yang berada di server Anda.
- Jika `node_modules` belum ada: jalankan `npm ci --include=optional` dari direktori `portfolio-website`.
- Restart server Node.js yang sedang berjalan. **Jangan menjalankan dua server pada port yang sama.**
- Buka `localhost:3080` dan tekan `Ctrl + Shift + R` untuk hard refresh; bila perlu bersihkan cache untuk localhost.
- Di Developer Tools > Network, pastikan halaman memuat `pir-motion-polish.css?v=20261114m`, `pir-scroll-experience.js?v=20261114m`, `pir-marquee.js?v=20261114m`, dan `pir-faq-accordion.js?v=20261114m`.

## Pemeriksaan fungsional yang disarankan

- Pada 100%, 75% dan 50% zoom: navbar menempel ke hero dan tetap tanpa sudut kanan melengkung.
- Scroll beberapa kali dengan roda mouse. Keyboard, touchpad dan mobile tetap mengontrol scroll secara native.
- Buka dan tutup tiga FAQ beberapa kali berturut-turut; coba juga tombol Enter.
- Amati marquee 20 detik; perhatikan tidak ada bidang kosong. Saat mouse berada di atasnya, teks tetap bergerak lambat.
- Periksa direktori dan halaman bisnis, khususnya navbar.

## Hasil QA di lingkungan ini

- 33/33 pemeriksaan Chromium berbasis markup dan asset yang disajikan server uji lulus: 5 lebar (390, 768, 1365, 1920, 4096 px), keselarasan garis, sudut, margin, marquee, FAQ klik cepat/keyboard dan reduced motion.
- Uji roda mouse: gerak bertahap menuju posisi target, bukan loncatan seketika.
- 6/6 tes Node baru untuk regresi source lulus.
- Suite historis website dalam paket terpisah: **150/178 lulus, 28 gagal**. Banyak tes historis masih mengacu versi CSS/JS terdahulu atau file level proyek induk yang tidak disertakan dalam paket website. Laporan lengkap `website-tests-m.log` disertakan.
- Ini **bukan** klaim website lulus QA produksi: koneksi MongoDB, email, autentikasi, dan backend produksi perlu diuji pada staging perusahaan.
