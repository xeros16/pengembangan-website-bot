# Patch Downloader: Pencarian Lagu, Antrean, dan Status

Patch ini ditujukan untuk proyek `bot-grup-desain` dari ZIP terbaru yang diaudit.

## Isi patch

- `features/commands/media-download.js`
  - Pencarian lagu hingga 5 hasil dengan `yt-dlp`.
  - Pilih hasil menggunakan `.song pilih <nomor>`.
  - Pilihan hasil berlaku 10 menit dan dipisahkan berdasarkan chat serta pengirim.
  - Antrean dibatasi 5 permintaan termasuk proses aktif; kapasitas antrean dicadangkan secara sinkron agar permintaan bersamaan tidak melewati batas.
  - Status tahap pencarian, unduhan, persiapan file, dan pengiriman.
  - ID nama file sementara dibuat unik untuk menghindari bentrok saat permintaan datang hampir bersamaan.
  - File sementara tetap dibersihkan setelah proses selesai atau gagal.
  - `.dl health` memeriksa Python + yt-dlp dan FFmpeg.
  - Pesan error dikelompokkan berdasarkan penyebab umum seperti timeout, jaringan, akses ditolak, modul hilang, format tidak didukung, dan file terlalu besar.
- `tests/media-download.test.js`
  - Tes validasi URL, pencarian/pemilihan lagu, serta batas antrean pada permintaan bersamaan.

## Perintah

```text
.song <judul lagu dan/atau artis>
.song pilih <nomor 1-5>
.dl <tautan>
.dl audio <tautan>
.dl video <tautan>
.dl image <tautan>
.dl status
.dl health
```

Pilihan resolusi video tidak termasuk patch ini.

## Pemasangan Windows

1. Hentikan bot.
2. Cadangkan dua file yang akan diganti.
3. Ekstrak ZIP patch ke folder sementara.
4. Salin folder `bot-grup-desain` dari patch ke folder proyek bot, lalu izinkan penggantian dua file tersebut.
5. Dari terminal di folder utama proyek, jalankan:

```bash
node --check features/commands/media-download.js
node --test tests/media-download.test.js
npm test
npm run check
```

6. Jika semua tes lulus, jalankan bot dan uji di chat WhatsApp. Pengujian lokal tidak menggantikan tes langsung pada Python, `yt-dlp`, FFmpeg, serta sesi WhatsApp milikmu.

Patch tidak menyertakan `.env`, kredensial, `auth_info`, cadangan sesi, maupun `node_modules`.
