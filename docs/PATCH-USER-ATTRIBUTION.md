# Patch: Identitas Pengguna pada Balasan Semua Perintah

## Perilaku

- Balasan teks dan caption yang dikirim bot ke chat yang memanggil perintah akan menyertakan identitas pemanggil.
- Di grup, bot menandai pengguna menggunakan nomor WhatsApp jika nomor tersedia.
- Di chat pribadi, bot menampilkan nomor pengguna jika tersedia.
- Jika Baileys hanya memberikan LID tanpa pemetaan nomor, patch tidak menganggap LID sebagai nomor telepon.
- Pesan media tanpa caption (misalnya audio atau stiker) tetap diikuti pesan singkat berisi identitas pengguna.
- Pesan yang dikirim ke chat lain sebagai notifikasi tidak diberi identitas pemanggil dari chat asal.
- Tidak mengubah hak akses atau isi logika command.

## File

- `features/command-handler.js`
- `features/command-attribution.js`
- `tests/command-attribution.test.js`

Patch ini juga membawa patch downloader sebelumnya:
- `features/commands/media-download.js`
- `tests/media-download.test.js`
- `PATCH-DOWNLOAD.md`

## Pemasangan Windows

1. Hentikan bot dan cadangkan file yang akan diganti.
2. Ekstrak ZIP patch ke folder sementara.
3. Salin folder `bot-grup-desain` dari patch ke folder proyek bot, pertahankan struktur folder, dan izinkan penggantian file.
4. Jalankan dari terminal folder proyek:

```bash
node --check features/command-handler.js
node --check features/command-attribution.js
node --check features/commands/media-download.js
node --test tests/command-attribution.test.js tests/media-download.test.js
npm test
npm run check
```

5. Jika tes yang relevan lulus, mulai bot dan uji satu perintah teks, satu perintah media, satu perintah game, dan satu perintah grup di WhatsApp.

## Privasi dan batas pengujian

Tag pada balasan grup terlihat oleh anggota grup. Identitas yang hanya tersedia sebagai LID tidak ditampilkan sebagai nomor telepon palsu. Pengujian lokal tidak menjamin perilaku pada semua versi Baileys/WhatsApp; uji langsung di grup percobaan sebelum diterapkan ke grup utama.

Patch tidak menyertakan `.env`, kredensial, sesi WhatsApp, backup sesi, `.git`, atau `node_modules`.
