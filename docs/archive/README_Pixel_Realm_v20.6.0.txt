PIXEL REALM v20.6.0 — GAMBAR MENU, HELP, DAN BANTUAN TERPISAH

Perubahan:
- .game menu dan .game visual hanya menggunakan pixel_realm_menu.png
- .game help menggunakan pixel_realm_help.png
- .game bantuan menggunakan pixel_realm_bantuan.png
- Caption setiap gambar disesuaikan dengan fungsi command.
- Jika gambar tidak ditemukan/gagal dikirim, bot tetap mengirim panduan dalam bentuk teks.

Pemasangan:
1. Hentikan bot dan cadangkan index.js lama.
2. Letakkan index_pixel_realm_v20.6.0_separate_menu_help_images.js di folder bot dan ubah namanya menjadi index.js.
3. Pastikan tiga gambar berada di folder yang sama dengan index.js:
   pixel_realm_menu.png
   pixel_realm_help.png
   pixel_realm_bantuan.png
4. Jika nama gambar help/bantuan milikmu berbeda, ubah namanya menjadi nama di atas ATAU set variabel di .env:
   GAME_MENU_IMAGE=pixel_realm_menu.png
   GAME_HELP_IMAGE=nama-gambar-help-kamu.png
   GAME_BANTUAN_IMAGE=nama-gambar-bantuan-kamu.png
5. Jangan menghapus .env, auth_info_baileys, node_modules, atau database MongoDB.
6. Jalankan npm start dan uji .game menu, .game help, .game bantuan.

Catatan:
- Hanya satu file index.js yang dijalankan. Jangan menjalankan file versi lama dan baru bersamaan.
- Gambar menu yang tersedia disertakan dalam paket. Gambar help dan bantuan tidak digandakan/dibuat ulang; gunakan gambar yang sudah kamu miliki.
- Pemeriksaan node --check lulus. Pengiriman gambar tetap perlu diuji pada WhatsApp milikmu.
