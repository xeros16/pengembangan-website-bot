# Laporan QA — PIR Visuals Designer Studio (2026-11-17)

## Perbaikan yang diuji

- Upload foto profil PNG/JPG/WebP dengan optimasi browser 512 × 512.
- Fallback upload file asli ketika preview/optimasi browser tidak tersedia.
- Downsampling server-side untuk foto beresolusi tinggi hingga 100 MP dan 32.768 px per sisi menggunakan Sharp.
- Pemisahan tombol Simpan perubahan dan Hapus karya.
- Jarak kontrol formulir testimoni/layanan dan tombol rating.
- Spasi label, input, helper text, checkbox, dan line-height textarea pada formulir profil.

## Hasil

| Pemeriksaan | Hasil |
|---|---:|
| `npm run check` website | Lulus |
| Tes upload + usability Designer Studio | 16/16 lulus |
| `npm run check` bot | 328 file JavaScript lulus |
| Tes integrasi upload bot | 5/5 lulus |
| Seluruh tes website | 275/332 lulus |

Seluruh tes website versi dasar v3.53.0 memiliki 57 kegagalan lama yang sama (273/330 lulus). Versi ini menambahkan dua tes yang lulus tanpa menambah jumlah kegagalan. Kegagalan tersebut berada di area intro, cache/release lama, animasi, navigasi publik, footer, dan audit keamanan yang tidak diubah dalam revisi ini.

## Batas verifikasi

File PNG asli milik pengguna belum tersedia sebagai file sumber untuk uji integrasi. Pengujian avatar beresolusi tinggi menggunakan PNG header terkontrol dan Sharp mock untuk memverifikasi alur resize 512 × 512. Uji browser langsung dan upload terhadap file asli tetap perlu dilakukan pada instalasi lokal.
