# Multiplayer Center

Perintah utama: `.multi`.

## Mode dan alur

### Sambung Kata
1. Host membuat ruang dengan `.multi buat sambung` di grup.
2. Peserta bergabung dengan `.multi gabung` (maksimal 12 pemain).
3. Host memulai dengan `.multi mulai` setelah minimal dua pemain bergabung.
4. Pemain menjawab bergiliran dengan `.multi jawab <kata>`. Kata harus diawali huruf terakhir dari kata sebelumnya dan tidak boleh mengulang kata.
5. Lihat giliran/skor dengan `.multi status` atau `.multi papan`.
6. Host menutup ruang dengan `.multi selesai`.

### Kuis Rebutan
1. Host membuat ruang dengan `.multi buat kuis [kategori]`.
2. Kategori: `semua`, `umum`, `sains`, `teknologi`, atau `desain`.
3. Peserta bergabung, lalu host memulai pertandingan.
4. Peserta yang sudah bergabung menjawab soal tercepat dengan `.multi jawab <jawaban>`. Jawaban benar mendapat 10 poin.
5. Gunakan `.multi status` dan `.multi papan`; host menutup ruang dengan `.multi selesai`.

### Duel Suit
1. Di grup yang sama, penantang mengirim `.multi duel <nomor>`.
2. Target memilih `.multi terima` atau `.multi tolak` dalam 5 menit.
3. Kedua pemain memilih `.multi suit batu`, `.multi suit gunting`, atau `.multi suit kertas`.
4. Hasil ditampilkan setelah kedua pilihan masuk.

## Aturan dan batasan

- Ruang grup hanya dapat dibuat di dalam grup WhatsApp.
- Hanya anggota ruang yang dapat menjawab pertandingan.
- Host adalah pembuat ruang; jika host keluar saat lobi, host dialihkan ke peserta berikutnya.
- Peserta tidak dapat keluar setelah pertandingan dimulai.
- Ruang maksimal 12 peserta.
- Tantangan duel kedaluwarsa setelah 5 menit.
- Semua peserta tetap harus berada pada chat/grup yang diizinkan bot.

## Penyimpanan

Snapshot ruang grup, tantangan duel, dan pertandingan duel disimpan di MongoDB ketika koneksi tersedia. Bot memulihkan snapshot saat startup; ruang lebih dari 24 jam, tantangan lebih dari 5 menit, dan duel lebih dari 1 jam dibuang saat pemulihan. Jika MongoDB terputus, permainan tetap dapat digunakan di memori, tetapi perubahan selama offline tidak dijamin bertahan setelah restart.
