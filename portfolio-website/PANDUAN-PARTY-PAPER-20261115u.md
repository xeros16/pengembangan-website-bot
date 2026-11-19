# PIR Visuals · Revisi efek Party Paper & garis manifesto (2026-11-15u)

## Perubahan
- Keempat kartu pada bagian **What are you looking to create?** mengeluarkan potongan kertas warna sage, ivory, hijau dan clay dari balik tepi kartu saat cursor masuk. Tautan tetap dapat diklik; animasi singkat dan sekali per hover-entry.
- Ilustrasi segel bundar di sisi kanan **Temukan talenta. Wujudkan ide besar.** mendapat ledakan potongan kertas dari balik lingkaran ketika di-hover (desktop; ilustrasi aslinya tersembunyi pada breakpoint mobile).
- Garis di atas langkah 01 tidak lagi bertumpuk dua kali. Semua garis pemisah langkah 01, 02, 03 berketebalan 1px.
- Efek nonaktif pada `prefers-reduced-motion: reduce` atau atribut `data-pv-motion="off"`. Tidak ada scroll listener atau loop animasi JavaScript permanen untuk efek ini.

## Cara pasang
1. Cadangkan folder website serta `.env` yang Anda gunakan.
2. Ekstrak ZIP Part 1, lalu ekstrak Part 2 **ke lokasi yang sama** agar folder `portfolio-website` tergabung.
3. Salin file ke folder proyek aktif (pastikan `server.js`, `pir-party-paper.css`, dan `pir-party-paper.js` berasal dari versi yang sama).
4. Jika dependensi belum terpasang, jalankan `npm ci --include=optional` dari folder `portfolio-website`.
5. Matikan proses Node.js lama lalu `npm start`.
6. Di Chrome tekan Ctrl+Shift+R; periksa tab Network agar `/pir-party-paper.css?v=20261115u` dan `/pir-party-paper.js?v=20261115u` merespons HTTP 200.

## Pemeriksaan manual
- Hover berturut-turut pada kartu Brand identity, Digital experiences, Visual storytelling, Campaign & content. Partikel harus muncul **di belakang** kartu dan tidak mengganggu klik.
- Hover pada gambar lingkaran PIR VISUALS di kanan CTA footer. Partikel muncul dan menghilang.
- Lihat garis langkah 01, 02, 03 pada section sage: tebal seragam.
- Periksa responsive di ponsel dan perangkat dengan pengaturan reduced motion; animasi hover tidak wajib tampil pada layar sentuh.

**Status:** revisi antarmuka untuk staging. Koneksi database, alur akun pengguna dan kesiapan produksi belum diverifikasi ulang dalam paket ini.


Tambahan revisi 20261115v:
- Teks poin manifesto 01–02 disejajarkan ulang agar sepusat seperti 03.
- Palette party paper pada 4 kartu kategori dibuat lebih gelap agar tetap terlihat di latar terang.
- Judul kolom footer (Jelajahi, Perusahaan, Untuk kreator) memakai serif editorial agar lebih berbeda dari link di bawahnya.
