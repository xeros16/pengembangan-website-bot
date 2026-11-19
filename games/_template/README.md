# Template game baru

Salin folder `_template` menjadi `games/<id-game>/` (contoh `games/sky-quest/`).

1. Ganti `sampleGame` dan metadata di `index.js`.
2. Pindahkan logika command ke `commands/` dan panggil dari handler.
3. Letakkan aturan permainan murni di `services/` dan katalog statis di `data/`.
4. Tambahkan tes di `tests/`.
5. Daftarkan ekspor game di `games/index.js`.
6. Pastikan command dan penyimpanan game tidak bentrok dengan game lain.

Jangan mengimpor state Pixel Realm kecuali fitur memang dirancang untuk berbagi data.
