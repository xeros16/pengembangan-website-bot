# Patch: Status Antrean Downloader

## Fitur
- Menambahkan perintah `.dl status` dan `.download status`.
- Menampilkan apakah ada unduhan aktif, jumlah antrean menunggu, dan jumlah total pekerjaan terhadap batas 5.
- Menunjukkan apakah permintaan pengirim sedang diproses atau posisi antreannya.
- Tidak menampilkan tautan atau judul permintaan milik pengguna lain.
- Memperbarui `.dl help` agar perintah status tercantum.
- Patch lanjutan menambahkan `.dl health` untuk pemeriksaan Python, yt-dlp, dan FFmpeg serta diagnosis error yang lebih jelas.

## File patch
- `features/commands/media-download.js`
- `tests/media-download.test.js`

## Pemasangan
1. Hentikan bot.
2. Cadangkan dua file di atas.
3. Ekstrak ZIP dan salin file dengan struktur folder yang sama.
4. Jalankan:

```bash
node --check features/commands/media-download.js
node --test tests/media-download.test.js
npm test
npm run check
```

5. Mulai ulang bot dan coba `.dl status` saat antrean kosong, lalu saat ada download aktif.

## Batasan
- Status antrean disimpan di memori, sehingga kembali kosong setelah bot restart.
- Pengujian lokal tidak menggantikan uji langsung pada WhatsApp, `yt-dlp`, dan FFmpeg.
- Patch tidak menambahkan pilihan resolusi video.
