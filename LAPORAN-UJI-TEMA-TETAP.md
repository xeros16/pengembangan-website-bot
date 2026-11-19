# Laporan QA — Tema Permanen PIR Visuals

**Perubahan:** Light/Dark switch dihapus, nilai preferensi sebelumnya diabaikan, tema tetap hero forest + latar cream/sage untuk semua halaman.

## Pemeriksaan yang berhasil

- Pemeriksaan sintaks `npm run check`: lulus.
- Unit test khusus tema dan kompatibilitas: 8/8 lulus.
- Chromium headless: 28/28 skenario visual lulus (7 rute × lebar 390, 768, 1365, 1920 px).
- Setiap skenario diperiksa untuk atribut tema tetap, ketiadaan tombol tema, navbar full-width dengan sudut bawah, serta tidak ada overflow horizontal.
- Hero dan FAQ beranda diverifikasi kontrasnya; menu mobile mempunyai dua tombol utilitas (Cari dan Animasi), tidak termasuk tema.
- Sampel render diperiksa untuk beranda, direktori, FAQ, Tentang, Untuk Bisnis, dan footer.

## Batasan penting

Pengujian render dilakukan dengan data MongoDB tiruan dan HTML/CSS yang di-inline untuk browser sandbox. Tindakan backend seperti login, database, pengiriman email dan pembayaran tidak divalidasi; paket ini **belum boleh disebut lulus audit produksi**.
Suite unit historis yang menuntut struktur monorepo penuh tidak seluruhnya dapat dijalankan pada paket website standalone. Kegagalan historis terkait metadata rilis dan file induk bukan hasil verifikasi fungsi backend baru.

## Pemeriksaan setelah instalasi

1. Hentikan server Node, timpa file dari kedua ZIP, lalu jalankan ulang.
2. Refresh paksa browser (Ctrl+Shift+R).
3. Pastikan Network menampilkan `/pir-permanent-theme.css?v=20261114g` status 200, dan tidak menampilkan stylesheet tema sebelumnya.
4. Periksa `/`, `/discover`, `/about`, `/for-business`, `/contact` pada desktop & ponsel.
5. Pastikan tombol Gelap/Terang tidak ada dan visual tidak berubah mengikuti mode browser.
