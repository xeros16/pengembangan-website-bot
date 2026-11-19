# Game tambahan v3.30.1

## Tebak Angka
- `.angka` / `.angka menu`: panduan.
- `.angka mulai`: pilih angka rahasia 1–50; tersedia 7 kesempatan.
- `.angka 25`: kirim tebakan angka.
- `.angka menyerah`: akhiri ronde dan tampilkan jawaban.
- `.angka skor`: statistik kemenangan dan poin pribadi.

Poin kemenangan dimulai dari 20 dan berkurang 2 poin untuk setiap kesempatan tambahan yang dipakai (minimum 5).

## Acak Kata
- `.acak` / `.acak menu`: panduan.
- `.acak mulai`: tampilkan huruf acak dan kategori.
- `.acak <jawaban>`: jawab susunan kata.
- `.acak hint`: tampilkan petunjuk.
- `.acak stop`: akhiri ronde dan tampilkan jawaban.
- `.acak skor`: statistik kemenangan dan poin pribadi.

Poin kemenangan dimulai dari 15 dan berkurang 2 poin untuk setiap percobaan tambahan (minimum 5).

Sesi disimpan berdasarkan kombinasi chat dan pemain agar sesi pribadi dan grup terpisah. MongoDB harus aktif.


## Misteri & Detektif — investigasi episodik (v3.31.0)

- `.misteri mulai` — mulai berkas kasus.
- `.misteri lokasi` — daftar lokasi investigasi.
- `.misteri kunjungi <kode>` — kunjungi lokasi dan buka akses ke bukti di sana.
- `.misteri bukti` — katalog bukti yang tersedia.
- `.misteri periksa <kode>` — kumpulkan detail bukti setelah mengunjungi lokasi terkait.
- `.misteri interogasi <nama>` — baca pernyataan tersangka.
- `.misteri jurnal` — lihat catatan investigasi.
- `.misteri petunjuk` — petunjuk tambahan bertahap.
- `.misteri tuduh <nama>` — pecahkan kasus; investigasi lengkap memberi bonus poin.

Setiap kasus menyediakan minimal tiga lokasi, tiga bukti, dan wawancara untuk seluruh tersangka.
