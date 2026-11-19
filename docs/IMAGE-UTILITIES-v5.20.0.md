# Image Utilities — pekerjaan v5.20.0

Tools ini memproses gambar yang dikirim langsung atau dibalas di chat WhatsApp. Semua proses memakai Sharp yang sudah menjadi dependensi proyek; tidak menambahkan layanan eksternal.

## Perintah

| Perintah | Fungsi | Contoh |
|---|---|---|
| `.info` | Membaca dimensi, ukuran, dan format | Balas gambar dengan `.info` |
| `.ratio` | Membaca rasio gambar | Balas gambar dengan `.ratio` |
| `.resize <lebar> <tinggi>` | Mengubah dimensi ke ukuran piksel yang diminta | `.resize 1080 1350` |
| `.crop <rasio>` | Crop dari tengah sesuai rasio | `.crop 1:1`, `.crop 4:5`, `.crop 16:9` |
| `.compress` | Mengompres ke JPEG kualitas 78 | Balas gambar dengan `.compress` |
| `.imgconvert <format> [kualitas]` | Konversi ke JPG, PNG, atau WebP | `.imgconvert webp 82` |
| `.palette` | Mengambil lima warna dominan | Balas gambar dengan `.palette` |

## Validasi dan perilaku

- Media unduhan dibatasi oleh `MAX_IMAGE_BYTES` yang sudah diterapkan di utilitas WhatsApp (12 MiB).
- Rasio crop menerima dua bilangan bulat positif maksimal 1000, dipisahkan titik dua.
- Crop mengambil area tengah; belum menyediakan pemilihan titik fokus manual.
- Kualitas konversi menerima 40–100; default 85.
- Transparansi diratakan ke putih saat output JPG agar area transparan tidak berubah menjadi hitam.
- PNG dapat lebih besar dari input; WebP/JPG juga tidak dijamin selalu lebih kecil. Bot melaporkan ukuran aktual sebelum dan sesudah.
- Tidak ada pengubahan file sumber; bot mengirim hasil sebagai media baru.

## Batas verifikasi

Tes unit parser rasio dan format dijalankan terpisah dari modul handler. Uji end-to-end dengan gambar WhatsApp, Sharp pada mesin target, dan pengiriman media langsung masih perlu dilakukan setelah dependensi dipasang.
