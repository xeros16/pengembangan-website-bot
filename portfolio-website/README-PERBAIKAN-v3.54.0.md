# Catatan Perbaikan PIR Visuals Website v3.54.0

Pembaruan ini memperbaiki upload foto profil resolusi tinggi dan keterbacaan formulir Designer Studio.

## Perubahan

1. Foto profil PNG/JPG/WebP tetap dibatasi 5 MB, tetapi kini dapat diproses hingga 100 megapiksel. Foto resolusi tinggi dipotong ke 512 × 512 dan disimpan sebagai WebP oleh Sharp di server bila optimasi browser tidak berhasil.
2. Preview browser tetap diupayakan. Jika browser tidak dapat membuat preview, file tetap ditandai sebagai terpilih dan akan divalidasi server ketika profil disimpan.
3. Tombol simpan dan hapus karya dipisahkan dengan jarak dan garis pemisah.
4. Form testimoni, layanan, dan profil memiliki jarak label/input/tombol yang konsisten.
5. Keterangan bantuan, checkbox, dan teks textarea memiliki line-height serta ruang yang lebih nyaman dibaca.

## Pemasangan

- Backup folder website dan data upload.
- Ganti folder `portfolio-website` dengan folder versi ini.
- Jalankan `npm ci` di folder `portfolio-website`.
- Restart website, lalu muat ulang browser dengan `Ctrl + Shift + R`.
- Jangan hapus `.env`, database, maupun folder `uploads`.
