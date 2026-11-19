# Panduan pemula PIR Visuals Bot

## Mulai dalam dua langkah

1. Ketik `.mulai`.
2. Pilih kebutuhan dan tingkat pengalamanmu. Bot akan memberi rekomendasi perintah yang bisa langsung digunakan.

Kamu tidak perlu menghafal nama command. Balas pertanyaan onboarding dengan nomor atau nama kebutuhan. Ketik `batal` untuk berhenti.

## Pintasan onboarding

- `.mulai` — mulai onboarding atau buka rekomendasi yang sudah disimpan.
- `.mulai cepat` — panduan ringkas tanpa pertanyaan.
- `.mulai profil` — lihat preferensi dan rekomendasi yang tersimpan.
- `.mulai ulang` — pilih ulang kebutuhan dan tingkat pengalaman.
- `.mulai batal` — batalkan onboarding aktif.

Preferensi disimpan di `User.preferences.onboarding` jika MongoDB tersedia. Jika database belum aktif, panduan tetap berjalan; preferensi hanya tersedia selama proses bot hidup.

## Cari fitur dengan bahasa sehari-hari

Gunakan `.cari <kebutuhan>`. Tidak perlu tahu nama perintah.

Contoh:
- `.cari bikin poster acara`
- `.cari ubah ukuran foto`
- `.cari belajar desain untuk pemula`
- `.cari mencari jasa desainer logo`
- `.cari membuat portofolio`
- `.cari aturan grup`

Pencarian hanya memberi rekomendasi; bot tidak menjalankan command secara otomatis. Kamu juga bisa memakai `.commands cari <kata>`.

## Ikuti alur sesuai tujuan

- `.alur poster` — membuat poster.
- `.alur logo` — membuat logo.
- `.alur sosial` — membuat konten media sosial.
- `.alur gambar` — mengolah gambar.
- `.alur revisi` — menangani revisi klien.
- `.alur aset` — mencari aset.
- `.alur belajar` — belajar desain.
- `.alur jasa` — mencari jasa/desainer.
- `.alur tawarkan` — menawarkan jasa desain.
- `.alur komunitas` — menggunakan fitur komunitas.
- `.alur game` — bermain game.

## Contoh: membuat poster

1. `.wizard` — susun brief dengan menjawab pertanyaan satu per satu.
2. `.creative poster acara sekolah` — cari arah konsep.
3. `.layout poster promosi` — dapatkan saran komposisi.
4. `.colorpalette kontras` — mulai dari palet warna.
5. `.checklist poster` — periksa desain sebelum dipublikasikan.

Bot membantu menyusun ide dan brief, tetapi tidak otomatis menghasilkan gambar melalui command ini. Periksa kembali ejaan, informasi, hak penggunaan font/aset, dan ukuran file sebelum mengirim hasil.

## Jika butuh bantuan

- `.menu` — kembali ke beranda.
- `.help <perintah>` — fungsi, format, akses, dan contoh.
- `.akses` — lihat peran dan status akun.
- `.ticket buka <subjek>` — buat tiket bantuan jika fitur tiket tersedia pada grup.
- `.portfolio notifikasi` — baca notifikasi Designer Studio di chat pribadi setelah akun website tertaut.

## Jika menemukan fitur terkunci

Ketik `.akses` untuk melihat status. Ketik `.menu premium` untuk melihat manfaat fitur berlangganan. Aktivasi berlangganan tetap mengikuti prosedur Owner; pembayaran otomatis tidak dijanjikan oleh onboarding.
