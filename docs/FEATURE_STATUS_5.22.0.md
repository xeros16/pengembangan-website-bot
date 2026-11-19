# Feature Status — v5.22.0

## Designer Workspace / Menu Designer

- Menu `.menu designer` diubah menjadi hub ringkas dengan kategori Brief & Ide, Font & Typography, Warna, Layout/Sosial/UX, QA/Produksi, Resource/Image, dan bantuan.
- Ditambahkan shortcut yang sebelumnya kurang terlihat: `.fontstudio`, `.layoutstudio`, `.socialkit`, `.resourcefind`, `.paletteview`, `.palettekit`, `.designsystem`, `.uxaudit`, dan `.uxflow`.
- Menu Designer disimpan di `content/texts.json` dan `content/texts.example.json`.
- `menuDesigner` ditambahkan ke daftar kunci editor Owner (`.textlist`, `.textshow`, `.textedit`) agar dapat diedit langsung.
- Batas edit teks Owner dinaikkan dari 1.800 ke 3.500 karakter supaya menu Designer dapat diedit dalam satu pesan. Perintah tetap Owner-only dan menggunakan pratinjau `.textsave`/`.textcancel`.
- Contoh untuk `.fontstudio`, `.layoutstudio`, `.socialkit`, dan `.resourcefind` diperbaiki pada katalog perintah; sebelumnya key contoh menimpa deskripsi.
- Dokumentasi perintah diperbarui dengan `npm run docs:commands`.

## Validation

- `node scripts/check-js.js`: lulus, 168 file JavaScript.
- `npm test`: lulus, 361/361 tes.
- Tes fokus menu Designer, general help, content editor, dan Design Studio: 37/37 lulus.
- Belum dilakukan uji WhatsApp live atau pengujian produksi.

## Release hygiene

Paket rilis tidak menyertakan `.env`, kredensial/sesi WhatsApp (`auth_info*`), `.git`, `node_modules`, konfigurasi allowlist privat, konfigurasi alias lokal, riwayat pencarian pribadi, backup, atau media portofolio pengguna.

## Inspiration & Learning (penambahan)

- `.designinspire <kategori> [tema/gaya]`: keyword referensi, arahan eksplorasi, latihan singkat, dan tautan pencarian Pinterest/Bing Images.
- Kategori inspirasi: poster, branding, UI, social media, packaging, illustration, typography, photography.
- `.designlearn <pemula|menengah|lanjutan> [dasar|warna|tipografi|layout]`: materi terstruktur dan latihan praktik sesuai tingkat.
- Kedua perintah terdaftar pada command router dan katalog bantuan, tanpa ketergantungan layanan eksternal.
- Batasan: tautan pencarian membuka layanan eksternal; hasil gambar, lisensi, dan relevansi tidak diverifikasi bot. Materi belajar berupa panduan mandiri, bukan evaluasi/sertifikasi otomatis.
- Tes terarah baru: `tests/design-learning.test.js` (6 tes).

## Inspiration & Learning Expansion — v5.22.1 candidate

- Mempertahankan `.designinspire` dan `.designlearn` yang sudah ada.
- Menambahkan `.designchallenge <harian|mingguan> [kategori]` dengan pustaka lokal, rotasi deterministik berdasarkan tanggal/minggu UTC, brief, batasan, output, dan evaluasi mandiri.
- Menambahkan `.portfolioguide mulai|checklist|case-study|bio` untuk membantu struktur portfolio, studi kasus, dan profil singkat.
- Kedua command baru diproses oleh modul `features/commands/design-learning.js` melalui router yang sudah ada; tidak menambah dependensi eksternal atau perubahan database.
- Menu Designer, katalog command, contoh, dan dokumentasi disinkronkan.
- Tidak ada penyimpanan progres challenge/draft portfolio dan tidak ada penilaian karya otomatis.
- Kandidat v5.22.1; uji WhatsApp live belum dilakukan.

## Validation — v5.22.1 candidate

- `node scripts/check-js.js`: lulus, 170 file JavaScript.
- `node --test tests/design-learning.test.js`: 11/11 lulus.
- `npm test`: 335 lulus, 6 gagal. Keenam kegagalan berhenti saat modul yang mengimpor `features/commands/image-processing.js` tidak menemukan dependensi `node-fetch`; bukan kegagalan assertion fitur Inspiration Learning.
- `npm ci` dicoba, tetapi tidak berhasil diselesaikan dalam lingkungan ini; `node_modules` belum tersedia.
- Dua tes setup yang sebelumnya gagal karena `.env.example` tidak ada kini ditangani dengan template tanpa kredensial nyata.
- Katalog command test dan generator dokumentasi belum dapat dieksekusi karena dependensi `node-fetch` belum tersedia; `docs/commands.md` diperbarui manual untuk command baru.
- Belum dilakukan pengujian MongoDB staging, WhatsApp live, atau uji penggunaan di grup.


## v5.23.0 — Designer Workflow candidate

- `.briefbuilder` reuses the existing seven-step `.wizard` session flow.
- `.moodboard` generates a curated text-based visual direction, not a rendered collage.
- `.designcritique` provides a manual rubric and can optionally call the existing multimodal vision service when `OPENAI_API_KEY` is configured.
- Existing `.critique`/`.rate` community peer review remains separate and unchanged.
- Validation and deployment status are recorded in the v5.23.0 handover; production readiness is not implied.
