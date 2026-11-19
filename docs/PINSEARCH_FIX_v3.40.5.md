> **Catatan historis:** Dokumen ini menjelaskan implementasi lama. Mulai v3.40.1, `.pinsearch` hanya membuat tautan pencarian Pinterest; tidak menggunakan API, scraping, atau pengiriman gambar otomatis.\n\n# PinSearch Repair Patch v3.40.5

## Perbaikan
- `.pinsearch kata kunci` sekarang mengirim **1 gambar secara default**.
- `.pinsearch kata kunci 3` meminta maksimal 3 gambar; angka tetap dibatasi 1–5.
- Riwayat hash gambar tersimpan di `data/pinsearch-history.json`, sehingga gambar yang pernah berhasil dikirim dilewati pada pencarian berikutnya, termasuk setelah bot dimulai ulang.
- Keterangan setiap gambar membedakan kandidat yang ditemukan melalui Pinterest dan kandidat cadangan yang ditemukan melalui Bing Images. Hasil Bing bisa saja dihosting situs lain; Bing adalah mesin penemunya, bukan selalu pemilik/host gambar.
- Daftar kandidat menyisihkan tempat untuk hasil Bing agar kandidat Pinterest yang semuanya HTTP 403 tidak menutup kesempatan fallback.
- Duplikat byte gambar tetap dicegah, dan gambar kecil/unduhan gagal dilewati.

## Pemasangan
1. Hentikan bot dengan `Ctrl+C`.
2. Cadangkan `features/commands/pinterest-search.js` dan `tests/pinterest-search.test.js`.
3. Ekstrak ZIP ke root proyek agar folder `features` dan `tests` bergabung dengan folder yang sudah ada.
4. Jalankan `node --test tests/pinterest-search.test.js`.
5. Jalankan `npm run check`, lalu `npm start`.

## Catatan
- Riwayat berada di `data/pinsearch-history.json`. Jangan hapus file itu jika ingin mempertahankan pencegahan kirim ulang setelah restart.
- Riwayat menyimpan hash file, bukan gambar itu sendiri. Maksimum 2.000 hash terakhir disimpan.
- Tes otomatis memakai respons tiruan. Akses live Pinterest/Bing masih dapat dibatasi oleh HTTP 403 atau perubahan situs.
