# Game Center UX — v5.18.0

Dokumen ini menstandarkan titik masuk bantuan dan alur dasar berdasarkan handler yang ada. Ini bukan klaim bahwa seluruh variasi permainan sudah diuji di WhatsApp.

## Prinsip
- Menu utama tetap teks; tombol interaktif bukan prasyarat bermain.
- Setiap game harus menjelaskan mulai, aksi/jawaban, bantuan, status/skor, dan cara berhenti.
- Jangan mengubah aturan, hadiah, penyimpanan, atau mekanisme inti hanya demi menyamakan tampilan.
- Prefix mengikuti konfigurasi `PREFIX`; contoh di bawah memakai `.`.

## Matriks enam permainan

| Game | Mulai | Aksi utama | Bantuan/status | Akhiri |
|---|---|---|---|---|
| Pixel Realm | `.pr` lalu `.pr mulai` | `.pr nama <nama>`, `.pr kelas <kelas>`, `.pr konfirmasi`; setelah karakter aktif gunakan `.pr jelajah` dan aksi battle | `.pr menu`, `.pr status`, `.pr peta` | `.pr kabur` untuk battle; tidak ada perintah universal reset sesi |
| Tebak-Tebakan Multikategori | `.tebak mulai [kategori] [mudah\|sedang\|sulit]` | `.tebak <jawaban>` | `.tebak menu`, `.tebak kategori`, `.tebak hint`, `.tebak skor`, `.tebak papan` | `.tebak stop` |
| Tebak Angka | `.angka mulai` | `.angka <1-50>` (maksimal 7 kesempatan) | `.angka menu`, `.angka skor`; respons memberi arah lebih besar/kecil | `.angka menyerah` |
| Acak Kata | `.acak mulai` | `.acak <jawaban>` | `.acak menu`, `.acak hint`, `.acak skor` | `.acak stop` |
| Misteri & Detektif | `.misteri mulai` | `.misteri kunjungi <kode lokasi>`, `.misteri periksa <kode bukti>`, `.misteri interogasi <nama>`, `.misteri tuduh <nama>` | `.misteri menu`, `.misteri lokasi`, `.misteri bukti`, `.misteri tersangka`, `.misteri jurnal`, `.misteri petunjuk`, `.misteri skor`, `.misteri papan` | `.misteri menyerah` |
| Multiplayer | Di grup: `.multi buat sambung` atau `.multi buat kuis [kategori]` | `.multi gabung`, host `.multi mulai`, peserta `.multi jawab <jawaban>` | `.multi menu`, `.multi status`, `.multi papan` | Host `.multi selesai`; saat lobi peserta `.multi keluar`; duel memakai `.multi terima/.multi tolak` dan `.multi suit <pilihan>` |

## Catatan perilaku yang harus dipahami pengguna

### Pixel Realm
Setup karakter adalah rangkaian beberapa pesan, bukan satu perintah. Setelah konfirmasi, pengguna dapat melihat status dan memulai eksplorasi. Sistem ini luas (wilayah, pertarungan, crafting, pet, dungeon, guild/party); tutorial bertahap lebih aman daripada menjejalkan semua subperintah ke satu menu. Selalu cek `.pr menu` di versi bot yang sedang berjalan untuk daftar terbaru.

### Tebak-Tebakan Multikategori
Game memilih soal acak dari kategori. Tingkat kesulitan memengaruhi poin. Hint mengurangi poin sesuai teks bantuan handler. Jika kategori atau tingkat kesulitan tidak tersedia, pengguna harus memilih nilai yang ditampilkan oleh `.tebak kategori`.

### Tebak Angka
Rentang angka 1–50, tujuh kesempatan. Setiap tebakan valid mengurangi kesempatan dan bot memberi arah. Sesi terkait chat dan pemain; mulai lagi setelah menang, kalah, atau menyerah.

### Acak Kata
Satu ronde menampilkan kategori, huruf acak, dan jumlah huruf. Hint menampilkan petunjuk. Jawaban dikirim sebagai argumen setelah `.acak`; stop menutup ronde dan memperlihatkan jawaban.

### Misteri & Detektif
Urutan investigasi yang disarankan: mulai kasus → kunjungi lokasi → periksa bukti yang terbuka di lokasi itu → interogasi tersangka → baca jurnal → gunakan petunjuk bila diperlukan → tuduh tersangka. Bukti tidak bisa diperiksa sebelum lokasi dikunjungi.

### Multiplayer
Ruang dibuat di grup, host mengelola mulai/selesai, dan peserta bergabung sebelum pertandingan dimulai. Minimal dua pemain dibutuhkan untuk mulai. Dokumentasi menyebut penyimpanan ruang dan skor melalui MongoDB; restart/persistensi perlu diverifikasi melalui tes integrasi sebelum dijanjikan kepada pemain. Duel Suit adalah alur terpisah dari ruang Sambung Kata/Kuis.

## Temuan audit awal
- Registry mendaftarkan enam permainan utama, serta dua modul pendukung `player` dan `mission` (bukan permainan ketujuh/kedelapan).
- Nama command Pixel Realm di registry adalah `pixelrealm`; alias `.pr`/`.pixelrealm` ditangani pada lapisan routing/alias. Pengujian alias harus tetap menjadi bagian regresi.
- Handler enam game memiliki bentuk bantuan berbeda. Sebagian sudah memiliki menu, status/skor, dan stop; Pixel Realm mempunyai banyak sub-sistem dan tidak setara dengan game mini.
- Beberapa petunjuk masih memakai contoh prefix literal di pesan Multiplayer. Audit lanjutan perlu memastikan semua teks mengikuti konfigurasi prefix.
- Multiplayer memiliki mode Sambung Kata, Kuis Rebutan, dan Duel Suit. Jangan merangkum ketiganya seolah-olah satu alur yang sama.

## Checklist QA sebelum rilis
- [ ] `.games`/`.game` menampilkan enam game utama dan sistem pendukung terpisah.
- [ ] `.help` untuk keenam command mengarah ke panduan yang sesuai.
- [ ] Semua menu memakai prefix konfigurasi, bukan titik yang ditanam permanen.
- [ ] Uji mulai, aksi valid, input salah, status/skor, stop, dan mulai ulang pada setiap game.
- [ ] Uji dua pemain dan batas host/peserta untuk Multiplayer.
- [ ] Uji sesi MongoDB dan restart bot; dokumentasikan game mana yang bertahan.
- [ ] Uji Pixel Realm dari setup karakter hingga eksplorasi/battle pada akun staging.
- [ ] Jalankan `npm run check` dan `npm test` dengan dependensi terpasang.
- [ ] Uji langsung di WhatsApp staging; jangan menyatakan lulus berdasarkan tes unit saja.

## Batas cakupan v5.18.0
Fokus rilis ini adalah UX, bantuan, dokumentasi, dan audit. Tidak termasuk perubahan sistem top-up atau pengembangan AI.
