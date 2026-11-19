> **Catatan historis:** Dokumen ini menjelaskan implementasi lama. Mulai v3.40.1, `.pinsearch` hanya membuat tautan pencarian Pinterest; tidak menggunakan API, scraping, atau pengiriman gambar otomatis.\n\n# PinSearch + BingSearch Split v3.40.6

## Perubahan
- `.pinsearch <kata kunci> [jumlah]` mencari Pinterest saja. Tidak ada fallback otomatis ke Bing.
- `.bingsearch <kata kunci> [jumlah]` mencari Bing Images saja.
- Alias `.pinterest` tetap tersedia; `.bingimages` juga tersedia.
- Jumlah default 1, maksimum 5.
- Riwayat lintas perintah disimpan di `data/pinsearch-history.json` berdasarkan URL gambar kanonis, bukan hash konten. URL yang sama akan dilewati meskipun file yang diunduh berubah; URL berbeda boleh dikirim walaupun isi gambarnya sama.
- Riwayat URL baru mulai tercatat setelah memasang patch ini. Versi lama hanya menyimpan hash gambar, jadi URL lama tidak dapat dipulihkan dari hash tersebut.

## File
- `features/commands/pinterest-search.js`
- `features/command-handler.js`
- `tests/pinterest-search.test.js`

## Pasang
1. Hentikan bot dengan `Ctrl+C`.
2. Cadangkan file yang disebutkan di atas.
3. Ekstrak ZIP ke root proyek, timpa ketiga file tersebut.
4. Jalankan `node --test tests/pinterest-search.test.js`.
5. Jalankan `npm run check`, lalu `npm start`.

## Contoh
- `.pinsearch Yae Miko` — satu gambar Pinterest
- `.pinsearch Yae Miko 3` — maksimal tiga gambar Pinterest
- `.bingsearch Furina` — satu gambar dari hasil Bing Images
- `.bingsearch Furina 3` — maksimal tiga gambar dari hasil Bing Images

Catatan: Bing adalah mesin pencari; gambar yang ditemukan melalui Bing dapat dihosting oleh situs lain. HTTP 403 atau pembatasan situs sumber masih dapat menyebabkan gambar gagal diunduh.
