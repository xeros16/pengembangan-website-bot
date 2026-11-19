# Patch Wizard Brief Desain

## Tujuan

Membantu anggota yang belum hafal perintah menyusun brief desain melalui pertanyaan satu per satu. Wizard menghasilkan brief teks yang bisa disalin; wizard ini **tidak membuat gambar otomatis**.

## Perintah

- `.wizard` — mulai panduan brief desain.
- `.briefwizard` — alias `.wizard`.
- `.wizard status` — lihat langkah yang sedang berjalan.
- `.wizard batal` — batalkan sesi.
- Jawab pertanyaan bot dengan pesan teks biasa. Pada pertanyaan opsional, ketik `lewati`.

## Alur

Wizard mengumpulkan jenis desain, tujuan, audiens, platform/ukuran, gaya visual, warna, serta teks wajib dan batasan. Setelah tujuh langkah, bot menyusun brief dan menyarankan perintah lanjutan yang relevan.

## Catatan perilaku

- Sesi terpisah untuk tiap pengguna dan chat.
- Sesi kedaluwarsa setelah 15 menit tidak aktif.
- Sesi disimpan di memori, sehingga hilang ketika bot dimulai ulang.
- Saat sesi aktif, pesan teks biasa dari pengguna tersebut dianggap sebagai jawaban wizard. Perintah bot yang diawali prefix tetap dapat digunakan. Batalkan dengan `.wizard batal` jika ingin berhenti.
- Untuk privasi dan kenyamanan, gunakan di chat pribadi jika tidak ingin jawaban tercampur dengan percakapan grup.

## Pemasangan

1. Matikan bot.
2. Ekstrak ZIP ke folder proyek yang sama dan timpa file yang diminta.
3. Jangan menimpa `.env`, folder autentikasi WhatsApp, database, atau data lokal.
4. Jalankan `npm test` dan `npm run check`.
5. Nyalakan bot, lalu uji `.wizard`, jawaban `1`, dan lanjutkan sampai brief selesai. Uji juga `.wizard status` serta `.wizard batal`.
