# Game Center

Seluruh game berada di folder `games/`. Setiap game memiliki folder, entry point, perintah, data, layanan, dan pengujian sendiri.

## Game Center — seluruh permainan

Gunakan `.games` atau `.game` untuk melihat daftar permainan yang tersedia. Game Center memisahkan permainan utama dari sistem pendukung pemain.

### Permainan utama

| Game | Perintah | Ringkasan |
|---|---|---|
| Pixel Realm | `.pr` / `.pixelrealm` | RPG petualangan dengan karakter, pertarungan, quest, pet, equipment, guild, dan progres tersimpan. |
| Tebak-Tebakan Multikategori | `.tebak` | Kuis pengetahuan umum, sains, teknologi, geografi, hewan, makanan, olahraga, sejarah, desain, dan logika. |
| Tebak Angka | `.angka` | Tebak angka rahasia 1–50 dengan maksimal tujuh kesempatan. |
| Acak Kata | `.acak` | Susun huruf acak menjadi kata dari berbagai kategori. |
| Misteri & Detektif | `.misteri` | Investigasi kasus fiksi melalui lokasi, bukti, wawancara, jurnal, dan deduksi. |
| Multiplayer | `.multi` | Sambung Kata, Kuis Rebutan, dan Duel Suit di grup. |

### Sistem pendukung pemain

- `.player` — profil, level, XP, koin, pencapaian, dan peringkat.
- `.mission` — misi harian dan hadiah koin/XP.
- `.shop`, `.buy`, `.inventory`, `.wallet`, `.daily` — ekonomi dan koleksi pemain.

### Panduan singkat

- `.games` — daftar game dan ringkasan fungsi.
- `.help tebak`, `.help angka`, `.help acak`, `.help misteri`, `.help multi`, `.help pr` — bantuan berdasarkan game.
- `.tutorial game` — panduan seluruh Game Center.

## Menambahkan game baru

Salin `games/_template/` ke `games/<id-game>/`, buat handler untuk game tersebut, lalu daftarkan di `games/index.js`. Hindari mengubah `index.js` bot untuk logika game baru.


## Misteri & Detektif

- `.misteri` / `.misteri menu` — panduan permainan.
- `.misteri mulai` — mulai satu kasus fiksi secara acak.
- `.misteri lokasi` — lihat lokasi investigasi.
- `.misteri kunjungi <kode>` — datangi lokasi untuk membuka bukti.
- `.misteri bukti` — lihat katalog bukti.
- `.misteri periksa <kode>` — periksa bukti setelah mengunjungi lokasinya.
- `.misteri interogasi <nama>` — baca pernyataan tersangka.
- `.misteri jurnal` — rangkuman lokasi, bukti, wawancara, dan petunjuk.
- `.misteri petunjuk` — buka petunjuk tambahan.
- `.misteri tersangka` — lihat daftar tersangka.
- `.misteri tuduh <nama>` — ajukan dugaan.
- `.misteri menyerah` — tutup kasus dan tampilkan solusi.
- `.misteri skor` — statistik kasus dan poin pribadi.
- `.misteri papan` — 10 detektif teratas.

Mode investigasi memiliki lokasi, bukti yang terkunci sampai lokasi dikunjungi, wawancara tersangka, jurnal, dan bonus poin berdasarkan kelengkapan penyelidikan. Cerita disajikan non-grafis dan berfokus pada deduksi. Sesi dipisahkan berdasarkan chat dan pemain; MongoDB diperlukan untuk menyimpan sesi dan skor.

## Multiplayer

- `.multi` — menu multiplayer.
- `.multi buat sambung` / `.multi buat kuis` — buat ruang di grup.
- `.multi gabung`, `.multi mulai`, `.multi jawab <teks>`, `.multi status`, `.multi selesai` — kelola permainan grup.
- `.multi duel 628xxxxxxxxxx` — tantang pemain untuk Suit di grup yang sama.
- `.multi terima` / `.multi tolak` — respons tantangan; `.multi suit batu|gunting|kertas` — pilih langkah.

Sesi multiplayer saat ini disimpan di memori proses. Ruang, tantangan, dan duel aktif akan berakhir jika bot direstart. Semua peserta tetap harus berada pada chat/grup yang sudah diizinkan whitelist.
