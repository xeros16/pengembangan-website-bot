# PIR Visuals — revisi scrolling stabil (14 November 2026)

## Apa yang berubah

Versi sebelumnya memakai pengendali `wheel` sendiri: setiap putaran roda mouse dicegah perilaku bawaannya lalu diterjemahkan menjadi puluhan perintah `scrollTo()` via `requestAnimationFrame`. Pada halaman dengan banyak efek visual, mekanisme ini bisa terasa patah, tertahan, atau meloncat.

Revisi ini **menghapus intersepsi wheel**. Scroll biasa, touchpad, sentuhan, scrollbar, dan keyboard diserahkan ke mesin browser. Hanya navigasi anchor / tautan menuju bagian dalam halaman yang memakai `window.scrollTo({ behavior: 'smooth' })` bawaan browser. `prefers-reduced-motion` tetap dihormati.

Animasi tulisan berjalan masih berlanjut ketika terlihat, namun berhenti menjalankan frame saat berada di luar layar. Lapisan latar yang sebelumnya `background-attachment: fixed` diganti `scroll` guna mengurangi repaints.

Tampilan PIR Visuals, warna, navbar, FAQ, footer, dan ilustrasi tetap dipertahankan.

## Cara memasang

1. Cadangkan folder website saat ini, terutama file `.env` yang berisi konfigurasi privat. Jangan timpa kredensial Anda.
2. Ekstrak **Part 1** ke lokasi proyek, lalu **Part 2** ke lokasi yang sama, sehingga folder `portfolio-website` tergabung.
3. Hentikan proses Node.js lama. Pastikan folder tempat menjalankan `npm start` adalah folder `portfolio-website` yang baru.
4. Jika dependensi belum ada, dari folder `portfolio-website` jalankan `npm ci --include=optional`.
5. Jalankan `npm start` seperti sebelumnya.
6. Buka `http://localhost:3080`, tekan `Ctrl+Shift+R`, lalu di Chrome DevTools > Network verifikasi `pir-scroll-experience.js?v=20261114n` dan `pir-motion-polish.css?v=20261114n` sudah dimuat.

## Uji lokal yang disarankan

- Di Windows pada zoom 100% dan 75%, scroll dengan roda mouse beberapa kali secara berurutan: tidak seharusnya ada jeda perhitungan animasi tambahan setelah wheel dilepas.
- Coba touchpad/drag scrollbar/keyboard: semuanya menggunakan mekanisme native browser.
- Buka dan tutup tiga FAQ, lalu arahkan mouse ke teks berjalan; keduanya tetap mengikuti efek yang sudah disetujui sebelumnya.
- Klik tautan ke section yang menggunakan `#anchor`; perpindahannya tetap menggunakan animasi halus native.

## Verifikasi yang dilakukan

- `npm run check`: lulus.
- 5 pengujian regresi baru: lulus.
- Uji Chromium sintetis pada lebar 390, 1365, dan 1920 px: wheel tidak dicegah, posisi scroll bergerak native, anchor menuju target, marquee offscreen berhenti, tidak ada error JavaScript; reduced-motion menggunakan perpindahan instan.
- Suite historis aplikasi website: **153/183 lulus; 30 gagal** (banyak pengujian lama mengunci versi dan pola animasi sebelumnya atau bergantung pada file proyek induk). Kesiapan backend produksi belum diverifikasi.

Catatan: peningkatan kelancaran pada komputer pengguna tetap dipengaruhi browser, GPU, ekstensi, kecepatan pointer, dan konten data nyata. Uji Chromium tidak sama dengan pengukuran frame-time di perangkat pengguna.
