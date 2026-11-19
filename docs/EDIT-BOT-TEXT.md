# Mengubah teks bot tanpa mengubah kode

File utama untuk teks yang tampil di menu dan bantuan adalah `content/texts.json`.

## Cara paling mudah

1. Matikan bot.
2. Buka folder proyek dengan Visual Studio Code.
3. Buka `content/texts.json`.
4. Ubah isi teks di antara tanda kutip. Jangan menghapus tanda kutip, koma, kurung kurawal, atau `\n` yang digunakan untuk baris baru.
5. Simpan sebagai UTF-8.
6. Jalankan `npm test`, lalu nyalakan bot kembali.

Contoh:

```json
"menuColors": "🎨 *WARNA & AKSESIBILITAS*\n\n• {prefix}colorpalette pastel — palet pastel"
```

Teks di dalam `{...}` adalah placeholder. `{prefix}` otomatis menjadi prefix bot dari `.env`, misalnya `.` atau `!`. Pada teks katalog, placeholder `{total}` dan `{categories}` juga diisi otomatis.

## Teks yang bisa diedit

- `mainMenu`: beranda `.menu`.
- `menuStart`: panduan pemula `.mulai`.
- `menuColors`, `menuImages`, `menuAssets`, `menuTools`: kategori alat desain.
- `menuTutorial`: ringkasan belajar.
- `menuGroup`: panduan proteksi grup.
- `menuMarket`: ringkasan marketplace.
- `menuGame`: ringkasan game.
- `menuAccount`, `menuPremium`, `menuOwner`: informasi akses dan peran.
- `menuNeeds`: menu alur berdasarkan kebutuhan.
- `commandListIntro`, `commandListNoResults`: tampilan katalog perintah.
- `unknownCommand`: respons jika perintah tidak dikenali.
- `tutorialDesign`, `tutorialMarketplace`, `tutorialGame`: materi tutorial.

## Mengedit melalui WhatsApp

Owner bot juga bisa menggunakan:

- `.textlist` — melihat semua kunci.
- `.textshow mainMenu` — melihat teks saat ini.
- `.textedit mainMenu | Teks menu baru` — membuat pratinjau.
- `.textsave` — menyimpan pratinjau.
- `.textcancel` — membatalkan pratinjau.
- `.textbackups` — daftar backup.
- `.textrestore 1` — pulihkan backup terbaru.

Perintah editor hanya untuk Owner bot. Setiap penyimpanan membuat backup otomatis di `content/backups/`.

## Catatan penting

- Maksimal 1.800 karakter per nilai jika diedit melalui WhatsApp.
- Setelah mengubah JSON secara manual, validasi formatnya dengan `npm test`.
- Jangan mengubah teks menjadi JSON yang tidak valid. Jika bot menampilkan error saat membaca teks, pulihkan backup terakhir atau salin ulang `content/texts.json` dari rilis bersih.
- File ini hanya mengatur teks tampilan yang didaftarkan di `features/content-editor.js`; teks internal pada fitur lain belum semuanya dipindahkan.


Paket pembaruan menyertakan `content/texts.example.json` sebagai template. Jika `content/texts.json` belum ada, bot akan membuatnya dari template tersebut saat pertama kali membaca teks. File `content/texts.json` milik instalasi lama harus dipertahankan saat update.
