# PIR Visuals — Forest backdrop fills the marked right column

## Revisi
- Latar forest diperluas ke seluruh kolom kanan carousel desktop, dari batas atas slide sampai area kontrol/panah di bawahnya.
- Area kiri tetap memakai latar sage semula; pembagian kolom 50:50 dan teks kiri tidak diubah.
- File gambar asli tidak diedit. Gambar tetap mengikuti ukuran intrinsiknya dan batas maksimum sebelumnya, memakai `object-fit: contain` agar tidak terpotong atau terdistorsi.
- Aturan ini khusus desktop; tampilan mobile tetap memakai susunan responsif sebelumnya.
- Cache stylesheet diperbarui ke `20261118s`.

## Validasi
- `npm run check`: PASS (seluruh pemeriksaan sintaks website).
- 37 pengujian carousel/media terkait: PASS.
- Integritas ZIP: diperiksa setelah paket dibuat.
- Paket hanya berisi folder `portfolio-website`; tidak menyertakan source code bot.
