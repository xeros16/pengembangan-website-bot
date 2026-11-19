# Instalasi Update PIR Visuals v6.7.3

## Isi update

- `.menu` dan `.help` tanpa topik hanya mengirim teks; poster menu utama tidak lagi digunakan.
- `.fitur` menampilkan seluruh command terdaftar dalam format teks per kategori, lengkap dengan deskripsi dan contoh yang tersedia.
- Pencarian, filter kategori, katalog ringkas berpaginasi, workflow, dan bantuan per command tetap tersedia.

## Cara memasang

1. Download kedua ZIP v6.7.3 dan extract keduanya ke folder tujuan yang sama. Gabungkan folder `PIR-Visuals-v6.7.3` jika diminta.
2. Buat backup folder bot aktif terlebih dahulu.
3. Pertahankan `.env`, folder sesi WhatsApp (`auth_info_baileys` atau nilai `AUTH_DIR`), data MongoDB, konfigurasi lokal, konten lokal, dan file upload milikmu. Jangan mengganti file lokal tersebut dengan contoh kosong.
4. Salin/merge source v6.7.3 ke direktori deployment sesuai struktur proyek.
5. Jika ingin membersihkan aset lama, hapus `assets/images/menu/pir_visuals_feature_menu.png` dari instalasi lama; versi baru tidak memakainya. Gambar menu Game Center Pixel Realm terpisah dan tidak dihapus.
6. Jalankan: `npm ci`
7. Jalankan pemeriksaan: `npm run check`, `npm run website:check`, dan `npm test`.
8. Jalankan bot: `npm start`.

## Contoh command

```text
.menu
.help
.fitur
.fitur cari musik
.fitur kategori Tools Desain
.fitur semua 2
.fitur alur
.help contrast
```

Tidak ada migrasi database atau perubahan `.env` yang diwajibkan oleh update ini. `FFmpeg`, `yt-dlp`, MongoDB, dan provider eksternal tetap mengikuti kebutuhan fitur yang sudah ada.
