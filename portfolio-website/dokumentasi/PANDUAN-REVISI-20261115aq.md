# PIR Visuals — Revisi keseimbangan jarak Jelajahi (AQ)

## Apa yang berubah

Pada `/discover`, batas antara latar panel **Mulai dari kebutuhanmu** dan band hijau **Cari talenta** kini berada di pertengahan ruang kosong sebelum formulir, termasuk ketika halaman di-zoom.

Penyebab aslinya adalah dua jarak dengan ukuran berbeda: `margin-bottom` di panel atas sekitar 24–38 px, sedangkan `padding-top` band sekitar 60–82 px. Keduanya diselaraskan memakai `--pv-discover-seam` yang responsif (42–60 px di desktop dan 31 px di viewport kecil). Total ruang di antara dua kotak dibuat kurang lebih tetap; batas latar dipindah ke titik tengah, bukan kotaknya yang asal digeser.

## File diperbarui

- `pir-public-polish.css` — aturan penutup AQ khusus `/discover`.
- `server.js` — versi URL CSS diubah ke `20261115aq` untuk mencegah cache lama.

## Bagian yang tetap

Warna tema hijau-krem, dimensi formulir Cari talenta, dekorasi orbit PIR Visuals, desain hero, tombol, navigasi, serta konten lain tidak diubah.

## Pemasangan

1. Cadangkan folder `portfolio-website` yang sedang digunakan.
2. Ekstrak ZIP dan gunakan folder `portfolio-website` lengkap di dalamnya.
3. Jalankan `npm install` (jika paket belum terpasang), kemudian `npm start` pada folder tersebut. Pastikan konfigurasi `.env` dari proyek lama dipertahankan secara aman.
4. Buka `http://localhost:3080/discover`, tekan `Ctrl + Shift + R`.
5. Bandingkan pada zoom 75%, 100%, 125%, 150% dan tampilan mobile. Pastikan batas hijau berada di tengah antara panel atas dan panel Cari talenta.

Catatan: pengujian visual pada situs produksi dengan database asli tetap perlu dilakukan di lingkungan Anda.
