# Audit UX Game Center — v5.18.0

Dokumen ini mencatat pemeriksaan statis terhadap implementasi dalam paket v5.18.0. Ini bukan bukti pengujian langsung di WhatsApp.

## Alur yang tersedia

| Game | Bantuan | Mulai | Cara bermain | Keluar/akhir |
|---|---|---|---|---|
| Pixel Realm (`.pr`) | `.pr` / `.pr menu` | `.pr mulai` | pembuatan karakter, kelas, status, jelajah, pertarungan, inventori, skill/toko | mengikuti alur RPG; cek bantuan perintah |
| Tebak-Tebakan (`.tebak`) | `.tebak menu` | `.tebak mulai [kategori] [kesulitan]` | kirim `.tebak <jawaban>`, `.tebak hint` | `.tebak stop` |
| Tebak Angka (`.angka`) | `.angka menu` | `.angka mulai` | `.angka <1–50>`; maksimal 7 kesempatan | `.angka menyerah` |
| Acak Kata (`.acak`) | `.acak menu` | `.acak mulai` | `.acak <kata>`, `.acak hint` | `.acak stop` |
| Misteri (`.misteri`) | `.misteri menu` | `.misteri mulai` | lokasi, bukti, interogasi, jurnal, petunjuk, tuduhan | `.misteri menyerah` |
| Multiplayer (`.multi`) | `.multi menu` | host membuat ruang dan memulai | Sambung Kata bergiliran; Kuis Rebutan; Duel Suit | `.multi selesai` (host) |

## Temuan dan tindakan v5.18.0

- Panduan Game Center mencantumkan keenam game dan membedakan game utama dari sistem pendukung pemain.
- Pesan alur Multiplayer diperbaiki agar menggunakan `PREFIX` yang dikonfigurasi. Sebelumnya beberapa balasan mengunci contoh ke `.multi`, sehingga instruksi salah untuk instalasi dengan prefix kustom.
- Dokumentasi Multiplayer diperbarui agar sesuai dengan snapshot persistence MongoDB yang digunakan kode saat ini; dokumentasi lama menyebut sesi hanya berada di memori.
- Ditambahkan tes regresi prefix kustom pada menu, pembuatan ruang, dan instruksi mulai.

## Batas pemeriksaan

- Pemeriksaan sintaks: 147 file JavaScript lolos.
- Tes Multiplayer: 8/8 lolos.
- Tes konten game terpilih: 16/16 lolos.
- `npm test` keseluruhan belum dapat dinyatakan lolos di lingkungan ini: beberapa suite tidak dapat dimuat karena dependensi `node-fetch` dan `mongoose` tidak terpasang; satu tes allowlist juga gagal karena konfigurasi lokal berisi beberapa grup tambahan yang tidak sesuai dengan fixture tes.
- Belum dilakukan uji WhatsApp langsung, uji MongoDB produksi, uji restart bot dengan data nyata, atau uji interaksi multi-pengguna pada grup.

## Saran validasi sebelum rilis

1. Pasang dependensi sesuai `package-lock.json`, lalu jalankan `npm ci` dan `npm test`.
2. Uji keenam game dari akun pengguna biasa pada grup yang diizinkan.
3. Uji Multiplayer dengan minimal dua akun: buat ruang, gabung, mulai, jawab, status, papan, dan selesai.
4. Uji ulang perintah Multiplayer memakai prefix selain `.`.
5. Uji pemulihan sesi Multiplayer setelah restart dengan MongoDB aktif.
