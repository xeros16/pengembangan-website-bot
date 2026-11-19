# PIR Visuals — Update Website Only (18 November 2026)

Paket ini hanya berisi folder `portfolio-website/`. Tidak ada source code bot WhatsApp atau folder bot yang disertakan karena revisi kali ini hanya menyentuh tampilan website.

## Perubahan
- Layout carousel Community Showcase dibuat lebih seimbang: area teks dan gambar hampir 50:50 pada desktop.
- Headline dan ruang teks diperbesar agar seimbang dengan media.
- Area gambar tetap tanpa frame/padding putih buatan dan rasio media tetap dipertahankan.
- Watermark dekoratif PIR pada area teks tetap dihilangkan.
- Versi cache stylesheet diperbarui.

## Cara memasang
1. Cadangkan folder `portfolio-website` yang sekarang.
2. Ekstrak ZIP ini di folder utama project yang sama, sehingga folder `portfolio-website` yang baru menimpa folder website lama.
3. Jangan menimpa atau menghapus folder/file bot di luar `portfolio-website`.
4. Pertahankan `.env` utama, database, `docs/commands.json`, dan folder upload yang sudah ada.
5. Dari folder utama project, jalankan `npm ci --prefix portfolio-website --no-audit --no-fund` bila dependensi website perlu diperbarui.
6. Jalankan pemeriksaan website dari folder `portfolio-website`: `npm run check` lalu `npm test`.
7. Restart service website.

Catatan: website tetap menggunakan konfigurasi `.env` utama dan data/folder bersama dari project yang sudah ada. ZIP ini bukan paket project lengkap yang berdiri sendiri.

## Revisi lanjutan — panel forest dan skala gambar
- Kolom teks dan media tetap seimbang 50:50 di desktop; lebar teks kiri dan hierarki tipografi dipertahankan.
- Latar hijau tua sekarang memenuhi seluruh kolom kanan, bukan hanya area kecil di belakang gambar.
- Gambar diperbesar sampai ukuran maksimum yang muat di panel hijau dengan `object-fit: contain`, sehingga karya tetap utuh tanpa crop atau distorsi.
- Di tablet/mobile, latar forest memenuhi area media dan gambar tetap mengikuti rasio asli.
- Cache stylesheet diperbarui ke `20261118r`.


## Revisi lanjutan — latar forest memenuhi area bertanda
- Latar forest diperluas ke seluruh kolom kanan carousel desktop, dari batas atas slide sampai area kontrol/panah di bawahnya.
- Area kiri tetap memakai latar sage semula; pembagian kolom 50:50 dan teks kiri tidak diubah.
- File gambar tidak diedit. Dimensi tampilannya memakai ukuran intrinsik dan batas maksimum yang sama, dengan `object-fit: contain` agar tidak terpotong atau terdistorsi.
- Aturan ini khusus desktop; tampilan mobile tetap memakai susunan responsif sebelumnya.
- Cache stylesheet diperbarui ke `20261118s`.
