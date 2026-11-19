# PIR Visuals v3.50.3 — Creative Studio Layout

Tanggal: 16 November 2026

## Perubahan
- Menyatukan hero Creative Studio ke satu rail konten terpusat dengan dua kolom desktop: judul di kiri, ringkasan dan statistik di kanan.
- Mengganti grid fitur menjadi dua kolom berukuran sama dengan jarak horizontal dan vertikal yang konsisten.
- Menyamakan tinggi kartu dalam setiap baris agar baris fitur rapi dan sejajar.
- Menata ulang CTA bawah dalam container terpusat yang mengikuti lebar grid fitur.
- Menghilangkan celah setelah hero dan merapikan sambungan antar-section sampai footer.
- Menumpuk hero, kartu, dan CTA dengan benar pada layar kecil.
- Menambahkan stylesheet khusus Creative Studio dengan cache-busting dan mengizinkan asetnya pada static route.

## Verifikasi
- Tes khusus Creative Studio: 4/4 lulus.
- Pemeriksaan layout Chromium: 1440 px, 2048 px, dan 390 px; tidak ditemukan horizontal overflow.
- Full test suite: 247 lulus, 47 gagal. Kegagalan tersebut berada pada tes lama di luar perubahan Creative Studio; termasuk beberapa tes yang merujuk file `features/command-catalog.js` yang tidak ada dalam paket sumber ini.
