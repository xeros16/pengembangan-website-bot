# Patch — Pusat Bantuan Berdasarkan Kebutuhan

## Tujuan
Membantu anggota memilih langkah sesuai pekerjaan desain, tanpa harus menghafal daftar perintah.

## Perintah baru
- `.alur` — daftar alur kerja yang tersedia.
- `.alur poster` — langkah membuat poster dari brief sampai checklist akhir.
- `.alur logo` — langkah eksplorasi konsep logo.
- `.alur sosial` — langkah membuat konten media sosial.
- `.alur gambar` — urutan memeriksa dan mengolah gambar.
- `.alur revisi` — membantu memperjelas revisi klien dan estimasi dasar.
- `.alur aset` — cara mencari atau meminta aset.
- `.alur belajar` — alur belajar teknik desain.
- `.kebutuhan` — alias `.alur`.
- `.menu kebutuhan` — menampilkan daftar tujuan.
- `.help alur` — penjelasan fungsi dan format perintah.

## Perilaku
- Setiap alur berisi urutan, contoh perintah, dan alasan menggunakan alat tersebut.
- Nama tujuan umum seperti `instagram`, `flyer`, dan `branding` dipetakan ke alur yang sesuai.
- Prefix mengikuti konfigurasi `PREFIX`.
- Tidak ada perintah yang dijalankan otomatis; bot hanya memberikan panduan.
- `.wizard` menyusun brief melalui tanya-jawab, bukan menghasilkan gambar.
- Estimasi `.pricing` tetap memerlukan langganan aktif.

## Pemasangan
Ekstrak patch kumulatif ke folder proyek dan timpa file yang sesuai. Jangan menimpa `.env`, autentikasi WhatsApp, atau database lokal. Jalankan `npm test` dan `npm run check` sebelum menyalakan bot.

## Validasi
Diuji pada salinan proyek lokal: 93 tes otomatis lulus, 0 gagal; 94 file JavaScript lolos pemeriksaan sintaks. Belum merupakan uji end-to-end di WhatsApp aktif.
