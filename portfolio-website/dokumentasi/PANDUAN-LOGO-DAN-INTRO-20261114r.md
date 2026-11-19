# PIR Visuals — Logo & Intro Replay (2026-11-14r)

## Perubahan

- Klik nama/ikon **PIR VISUALS** di pojok kiri atas pada semua halaman yang memakai shell publik akan menuju `/?pv_intro=1`, memutar ulang loading intro, lalu menampilkan Beranda.
- Setelah intro selesai atau dilewati, query sementara `pv_intro=1` dihapus dari URL dengan `history.replaceState`, tanpa memuat ulang halaman lagi.
- Kunjungan biasa tetap memakai perilaku intro sebelumnya: hanya pada awal sesi. Klik logo menjadi pemicu eksplisit yang selalu dapat memutar ulang intro.
- Pengguna dengan preferensi sistem *reduced motion* tidak dipaksa menonton intro; parameter sementara tetap dibersihkan.
- Header/navigasi global selalu menampilkan **PIR VISUALS** dengan ikon platform `/icon.svg`. Pada versi sebelumnya halaman profil dapat mengubah nama dan menampilkan avatar di sebelah ikon situs.
- Nama dan foto masing-masing desainer tetap mengikuti record profil dan ditampilkan pada hero/portrait halaman portofolio publik, bukan menggantikan logo platform.

## Cara memasang

1. Cadangkan folder `portfolio-website` dan `.env` perusahaan.
2. Ekstrak Part 1 lalu Part 2 ke direktori yang sama dan timpa file versi sebelumnya.
3. Dari folder `portfolio-website`, jalankan `npm ci --include=optional` bila dependensi belum terpasang, lalu `npm start`.
4. Buka `http://localhost:3080/`, klik logo kiri atas. Lihat intro kemudian pastikan URL kembali ke `/`.
5. Ulangi dari `/discover` dan halaman profil desainer. Logo harus selalu PIR VISUALS.
6. Jika browser masih menampilkan versi lama, restart server dan gunakan **Ctrl + Shift + R**. Pastikan `pir-intro-experience.js?v=20261114r` dimuat di Network.

## Batas pemeriksaan

- Pengujian Node.js untuk intro dan identitas merek: **8/8 lulus**.
- Pemeriksaan HTTP pada `/`, `/discover`, `/about`, dan `/?pv_intro=1`: **4/4 HTTP 200**, nama/logo/link navbar benar pada HTML.
- CSS/JavaScript/SVG intro: seluruh URL yang diperiksa **HTTP 200**.
- Chromium headless di lingkungan pengujian memblokir akses localhost (`ERR_BLOCKED_BY_ADMINISTRATOR`). Animasi visual dan perilaku klik pada Windows pengguna perlu diverifikasi setelah pemasangan.
- Uji backend produksi dan integrasi akun/desainer dengan database asli **belum dilakukan**.

Paket ini untuk **staging**, bukan jaminan siap produksi.
