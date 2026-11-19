# PIR Visuals v5.89.0 — Beginner Experience & Guided Onboarding

## Tujuan rilis
Membuat PIR Visuals Bot lebih mudah digunakan oleh anggota baru tanpa mengganti arsitektur command, menghapus fitur lama, atau mengubah hak akses.

## Fitur utama

### 1. Onboarding interaktif `.mulai`
- Dua langkah: memilih kebutuhan utama dan tingkat pengalaman.
- Pilihan: membuat desain, belajar desain, mengolah gambar, mencari jasa/desainer, menawarkan jasa, menggunakan fitur komunitas, dan bermain game.
- Rekomendasi disesuaikan untuk level pemula, menengah, dan berpengalaman.
- `.mulai cepat` membuka panduan ringkas tanpa pertanyaan.
- `.mulai profil` menampilkan preferensi dan rekomendasi yang tersimpan.
- `.mulai ulang` mengulang pemilihan kebutuhan.
- `.mulai batal` membatalkan onboarding aktif.
- Sesi onboarding dipisahkan per anggota dan chat; memulai onboarding baru membersihkan sesi brief desain yang belum selesai agar pertanyaan tidak saling bertabrakan.

### 2. Preferensi pengguna
- Preferensi disimpan pada `User.preferences.onboarding`.
- Tidak ada perubahan schema atau migrasi database karena `preferences` sudah bertipe Mixed.
- Penyimpanan hanya dilakukan ketika koneksi MongoDB siap.
- Jika database tidak tersedia, panduan tetap bekerja dan preferensi sementara disimpan di memori proses.

### 3. Pencarian kebutuhan `.cari`
- Mendukung bahasa sehari-hari dan sinonim Indonesia/Inggris.
- Contoh: `.cari bikin poster acara`, `.cari ubah ukuran foto`, `.cari belajar desain untuk pemula`, `.cari mencari jasa desainer`.
- `.commands cari <kata>` menggunakan mesin pencarian yang sama.
- Hasil hanya berupa rekomendasi; bot tidak menjalankan perintah otomatis.

### 4. Workflow dan navigasi
- `.alur` ditambah alur mencari jasa, menawarkan jasa, komunitas, dan game.
- Menu utama diringkas berdasarkan kebutuhan.
- Pesan sambutan default menampilkan `.mulai`, `.cari`, dan `.rules`.
- Teks `content/texts.json` dan `content/texts.example.json` disinkronkan untuk menu yang diperbarui.

### 5. Release hygiene
- Menambahkan `npm run audit:release`.
- Audit rilis menolak `.env`, sesi WhatsApp, backup, allowlist lokal, custom runtime config, data riwayat lokal, dan direktori upload/temp.
- Tidak ada dependency runtime baru.

## Kompatibilitas
- Command lama tetap tersedia.
- Prefix bot yang dikonfigurasi dihormati pada onboarding, pencarian, dan workflow.
- Menu tetap menggunakan teks agar kompatibel lintas klien WhatsApp.
- Fitur premium/Owner/Admin tetap mengikuti access control yang ada.

## Validasi
Lihat `QA_REPORT_v5_89_0.md` untuk hasil tes dan batas validasi staging.
