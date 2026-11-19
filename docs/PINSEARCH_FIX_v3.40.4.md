> **Catatan historis:** Dokumen ini menjelaskan implementasi lama. Mulai v3.40.1, `.pinsearch` hanya membuat tautan pencarian Pinterest; tidak menggunakan API, scraping, atau pengiriman gambar otomatis.\n\n# PinSearch Repair Patch v3.40.4

## Perbaikan
- Tetap melewati ikon/thumbnail kecil (<300x300).
- Sekarang hasil cadangan Bing Images ikut dikumpulkan meskipun Pinterest sudah mengembalikan kandidat gambar.
- Jika kandidat Pinterest ternyata ikon, handler dapat melanjutkan ke kandidat Bing untuk memenuhi jumlah gambar yang diminta.
- Hasil duplikat tetap dilewati.

## Pemasangan
1. Hentikan bot dengan Ctrl+C.
2. Cadangkan `features/commands/pinterest-search.js` dan `tests/pinterest-search.test.js`.
3. Ekstrak isi ZIP ke root proyek agar folder `features` dan `tests` bergabung dengan folder yang sudah ada.
4. Jalankan `node --test tests/pinterest-search.test.js`.
5. Jalankan `npm run check`, lalu `npm start`.

Catatan: tes otomatis menguji logika cadangan dengan respons tiruan; akses live Pinterest/Bing tetap bergantung pada jaringan dan perubahan situs.
