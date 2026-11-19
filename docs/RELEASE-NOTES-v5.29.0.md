# PIR Visuals v5.29.0 — Portfolio Management

## Perubahan
- Designer Studio `/studio` kini dapat upload, edit metadata, dan hapus karya.
- Upload multipart dibatasi 8 MB, satu gambar per request.
- Format input JPEG, PNG, WebP; validasi decoding dilakukan Sharp dengan batas 20 megapixel.
- Gambar dirotasi sesuai metadata EXIF, resize maksimal 1800 px, dikonversi WebP quality 82, diberi watermark PIR VISUALS.
- File disimpan di folder upload yang dikonfigurasi dan path relatif dicatat di koleksi `portfolioitems` yang sama dengan bot.
- Semua upload baru masuk moderasi `pending`; edit karya juga mengembalikan status ke `pending`.
- Edit/hapus hanya dapat dilakukan untuk item yang cocok dengan `designerId` session dan `ownerJid`.
- Form mutasi menggunakan CSRF token; file tidak ditayangkan ke publik sebelum disetujui Owner.
- Bot Baileys dan Game Center tetap terpisah dari website.

## Batasan
- Owner masih menggunakan alur moderasi WhatsApp yang sudah ada (`.portfolio pending`, approve/reject); website belum mengirim pesan otomatis ke WhatsApp karena website sengaja tidak menjalankan sesi Baileys.
- Upload gambar tidak menghapus karya lama ketika edit; hanya metadata yang diedit. Untuk mengganti gambar, hapus karya dan unggah ulang.
- Belum ada multi-file upload, crop UI, atau penyimpanan session persisten.

## Validasi lokal
- `node scripts/check-js.js`: lulus, 170 file JavaScript.
- Website tests: 11/11 lulus.
- Designer Studio regression tests: 4/4 lulus.
- Root suite: 321/328 lulus; 7 gagal pada pengujian command catalog/routing dan growth/game/help yang sudah ada pada environment ini. Tidak ditandai lulus.
- Uji integrasi memerlukan MongoDB dan akun desainer nyata.
